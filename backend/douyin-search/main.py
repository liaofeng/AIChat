from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import json
import uuid

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class VideoBase(BaseModel):
    title: str
    coverUrl: str
    length: str
    author: dict
    stats: dict
    createdAt: str

class Video(VideoBase):
    id: str

# Initialize file-based SQLite database
def init_db():
    conn = sqlite3.connect('videos.db', check_same_thread=False)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            title TEXT,
            coverUrl TEXT,
            length TEXT,
            author TEXT,
            stats TEXT,
            createdAt TEXT
        )
    ''')
    conn.commit()
    return conn

db = init_db()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

class PaginatedResponse(BaseModel):
    videos: List[Video]
    total: int
    page: int
    per_page: int

@app.get("/api/videos", response_model=PaginatedResponse)
async def get_videos(
    query: Optional[str] = None,
    date_filter: Optional[str] = Query(None, regex="^(today|week|month|all)$"),
    sort_by: Optional[str] = Query(None, regex="^(likes|date)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1)
):
    cursor = db.cursor()
    
    # Base query
    sql = "SELECT * FROM videos"
    count_sql = "SELECT COUNT(*) FROM videos"
    params = []
    
    # Search filter
    if query:
        sql += " WHERE title LIKE ?"
        count_sql += " WHERE title LIKE ?"
        params.append(f"%{query}%")
    
    # Date filter
    if date_filter and date_filter != "all":
        now = datetime.utcnow()
        if date_filter == "today":
            date_limit = now - timedelta(days=1)
        elif date_filter == "week":
            date_limit = now - timedelta(weeks=1)
        else:  # month
            date_limit = now - timedelta(days=30)
            
        where_or_and = "AND" if query else "WHERE"
        sql += f" {where_or_and} datetime(createdAt) > datetime(?)"
        count_sql += f" {where_or_and} datetime(createdAt) > datetime(?)"
        params.append(date_limit.isoformat())
    
    # Get total count
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()[0]
    
    # Sorting
    if sort_by == "likes":
        sql += " ORDER BY json_extract(stats, '$.likes') DESC"
    else:
        sql += " ORDER BY createdAt DESC"
    
    # Add pagination
    offset = (page - 1) * per_page
    sql += " LIMIT ? OFFSET ?"
    params.extend([per_page, offset])
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    videos = []
    for row in rows:
        video = {
            "id": row[0],
            "title": row[1],
            "coverUrl": row[2],
            "length": row[3],
            "author": json.loads(row[4]),
            "stats": json.loads(row[5]),
            "createdAt": row[6]
        }
        videos.append(video)
    
    return {
        "videos": videos,
        "total": total_count,
        "page": page,
        "per_page": per_page
    }

@app.post("/api/videos")
async def create_video(video: VideoBase):
    cursor = db.cursor()
    video_id = str(uuid.uuid4())  # Use UUID instead of hash
    
    cursor.execute(
        "INSERT INTO videos VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            video_id,
            video.title,
            video.coverUrl,
            video.length,
            json.dumps(video.author),
            json.dumps(video.stats),
            video.createdAt
        )
    )
    db.commit()
    
    return {"id": video_id, **video.dict()}

@app.put("/api/videos/{video_id}")
async def update_video(video_id: str, video: VideoBase):
    cursor = db.cursor()
    
    cursor.execute("SELECT id FROM videos WHERE id = ?", (video_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Video not found")
    
    cursor.execute(
        """
        UPDATE videos 
        SET title=?, coverUrl=?, length=?, author=?, stats=?, createdAt=?
        WHERE id=?
        """,
        (
            video.title,
            video.coverUrl,
            video.length,
            json.dumps(video.author),
            json.dumps(video.stats),
            video.createdAt,
            video_id
        )
    )
    db.commit()
    
    return {"id": video_id, **video.dict()}

@app.delete("/api/videos/{video_id}")
async def delete_video(video_id: str):
    cursor = db.cursor()
    
    cursor.execute("SELECT id FROM videos WHERE id = ?", (video_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Video not found")
    
    cursor.execute("DELETE FROM videos WHERE id = ?", (video_id,))
    db.commit()
    
    return {"status": "success", "message": "Video deleted"}

package db

import (
	"database/sql"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var (
	// Prepared statements for better performance
	stmtGetVideos   *sql.Stmt
	stmtCreateVideo *sql.Stmt
	stmtUpdateVideo *sql.Stmt
	stmtDeleteVideo *sql.Stmt
)

// InitDB initializes the SQLite database with connection pooling
func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "videos.db")
	if err != nil {
		return nil, err
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)

	// Create videos table if not exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS videos (
			id TEXT PRIMARY KEY,
			title TEXT,
			coverUrl TEXT,
			length TEXT,
			author TEXT,
			stats TEXT,
			createdAt TEXT
		)
	`)
	if err != nil {
		return nil, err
	}

	// Create indexes for better search performance
	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title)`)
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(createdAt)`)
	if err != nil {
		return nil, err
	}
	
	// Set connection pool settings for better concurrent access
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	if err != nil {
		return nil, err
	}

	// Prepare statements
	if err := prepareStatements(db); err != nil {
		return nil, err
	}

	return db, nil
}

func prepareStatements(db *sql.DB) error {
	var err error

	// Prepare statement for getting videos with dynamic WHERE clause
	stmtGetVideos, err = db.Prepare(`
		SELECT id, title, coverUrl, length, author, stats, createdAt
		FROM videos
		WHERE (? = '' OR title LIKE ?)
		AND (? = '' OR datetime(createdAt) > datetime(?))
		ORDER BY CASE 
			WHEN ? = 'likes' THEN json_extract(stats, '$.likes')
			ELSE datetime(createdAt)
		END DESC
		LIMIT ? OFFSET ?
	`)
	if err != nil {
		return err
	}

	// Prepare statement for creating a video
	stmtCreateVideo, err = db.Prepare(`
		INSERT INTO videos (id, title, coverUrl, length, author, stats, createdAt)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}

	// Prepare statement for updating a video
	stmtUpdateVideo, err = db.Prepare(`
		UPDATE videos 
		SET title=?, coverUrl=?, length=?, author=?, stats=?, createdAt=?
		WHERE id=?
	`)
	if err != nil {
		return err
	}

	// Prepare statement for deleting a video
	stmtDeleteVideo, err = db.Prepare(`
		DELETE FROM videos WHERE id=?
	`)
	if err != nil {
		return err
	}

	return nil
}

// CloseDB closes all prepared statements and the database connection
func CloseDB(db *sql.DB) {
	if stmtGetVideos != nil {
		stmtGetVideos.Close()
	}
	if stmtCreateVideo != nil {
		stmtCreateVideo.Close()
	}
	if stmtUpdateVideo != nil {
		stmtUpdateVideo.Close()
	}
	if stmtDeleteVideo != nil {
		stmtDeleteVideo.Close()
	}
	if db != nil {
		db.Close()
	}
}

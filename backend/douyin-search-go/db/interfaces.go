package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/liaofeng/AIChat/backend/douyin-search-go/models"
)

// VideoStore defines the interface for video operations
type VideoStore interface {
	GetVideos(query, dateFilter, sortBy string, page, perPage int) ([]models.Video, int, error)
	CreateVideo(video *models.VideoBase, id string) error
	UpdateVideo(id string, video *models.VideoBase) error
	DeleteVideo(id string) error
}

// Store implements VideoStore interface
type Store struct {
	db *sql.DB
}

// NewStore creates a new Store instance
func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// GetVideos implements VideoStore.GetVideos
func (s *Store) GetVideos(query, dateFilter, sortBy string, page, perPage int) ([]models.Video, int, error) {
	// Implementation moved from queries.go
	var videos []models.Video
	var total int
	
	// Calculate date limit based on filter
	var dateLimit string
	if dateFilter != "" && dateFilter != "all" {
		now := time.Now().UTC()
		switch dateFilter {
		case "today":
			dateLimit = now.AddDate(0, 0, -1).Format(time.RFC3339)
		case "week":
			dateLimit = now.AddDate(0, 0, -7).Format(time.RFC3339)
		case "month":
			dateLimit = now.AddDate(0, -1, 0).Format(time.RFC3339)
		}
	}

	// Get total count with a separate count query
	var countQuery string
	var countParams []interface{}
	
	countQuery = "SELECT COUNT(*) FROM videos WHERE 1=1"
	if query != "" {
		countQuery += " AND title LIKE ?"
		countParams = append(countParams, fmt.Sprintf("%%%s%%", query))
	}
	if dateFilter != "" && dateFilter != "all" && dateLimit != "" {
		countQuery += " AND datetime(createdAt) > datetime(?)"
		countParams = append(countParams, dateLimit)
	}
	
	err := s.db.QueryRow(countQuery, countParams...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results with a separate query
	var selectQuery string
	var selectParams []interface{}
	
	selectQuery = "SELECT id, title, coverUrl, length, author, stats, createdAt FROM videos WHERE 1=1"
	if query != "" {
		selectQuery += " AND title LIKE ?"
		selectParams = append(selectParams, fmt.Sprintf("%%%s%%", query))
	}
	if dateFilter != "" && dateFilter != "all" && dateLimit != "" {
		selectQuery += " AND datetime(createdAt) > datetime(?)"
		selectParams = append(selectParams, dateLimit)
	}
	
	selectQuery += " ORDER BY CASE WHEN ? = 'likes' THEN json_extract(stats, '$.likes') ELSE datetime(createdAt) END DESC"
	selectParams = append(selectParams, sortBy)
	
	selectQuery += " LIMIT ? OFFSET ?"
	selectParams = append(selectParams, perPage, (page-1)*perPage)
	
	rows, err := s.db.Query(selectQuery, selectParams...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var v models.Video
		err := rows.Scan(&v.ID, &v.Title, &v.CoverURL, &v.Length, &v.Author, &v.Stats, &v.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		videos = append(videos, v)
	}

	return videos, total, nil
}

// CreateVideo implements VideoStore.CreateVideo
func (s *Store) CreateVideo(video *models.VideoBase, id string) error {
	_, err := stmtCreateVideo.Exec(
		id,
		video.Title,
		video.CoverURL,
		video.Length,
		video.Author,
		video.Stats,
		video.CreatedAt,
	)
	return err
}

// UpdateVideo implements VideoStore.UpdateVideo
func (s *Store) UpdateVideo(id string, video *models.VideoBase) error {
	result, err := stmtUpdateVideo.Exec(
		video.Title,
		video.CoverURL,
		video.Length,
		video.Author,
		video.Stats,
		video.CreatedAt,
		id,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// DeleteVideo implements VideoStore.DeleteVideo
func (s *Store) DeleteVideo(id string) error {
	result, err := stmtDeleteVideo.Exec(id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

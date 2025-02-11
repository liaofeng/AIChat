package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/liaofeng/AIChat/backend/douyin-search-go/models"
)

// GetVideos retrieves videos with filtering, sorting, and pagination
func GetVideos(query, dateFilter, sortBy string, page, perPage int) ([]models.Video, int, error) {
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

	// Get total count
	var total int
	queryParam := fmt.Sprintf("%%%s%%", query)
	row := stmtGetVideos.QueryRow(query, queryParam, dateFilter, dateLimit, sortBy, perPage, (page-1)*perPage)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get paginated results
	rows, err := stmtGetVideos.Query(query, queryParam, dateFilter, dateLimit, sortBy, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var videos []models.Video
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

// CreateVideo creates a new video entry
func CreateVideo(video *models.VideoBase, id string) error {
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

// UpdateVideo updates an existing video
func UpdateVideo(id string, video *models.VideoBase) error {
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

// DeleteVideo deletes a video by ID
func DeleteVideo(id string) error {
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

// VideoExists checks if a video exists by ID
func VideoExists(id string) (bool, error) {
	var exists bool
	err := stmtGetVideos.QueryRow("", "", "", "", "", 1, 0).Scan(&exists)
	return exists, err
}

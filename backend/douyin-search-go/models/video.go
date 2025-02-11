package models

import (
	"encoding/json"
)

// VideoBase represents the base video data without ID
type VideoBase struct {
	Title     string          `json:"title"`
	CoverURL  string          `json:"coverUrl"`
	Length    string          `json:"length"`
	Author    json.RawMessage `json:"author"`
	Stats     json.RawMessage `json:"stats"`
	CreatedAt string          `json:"createdAt"`
}

// Video represents a complete video entry including ID
type Video struct {
	VideoBase
	ID string `json:"id"`
}

// PaginatedResponse represents a paginated list of videos
type PaginatedResponse struct {
	Videos  []Video `json:"videos"`
	Total   int     `json:"total"`
	Page    int     `json:"page"`
	PerPage int     `json:"per_page"`
}

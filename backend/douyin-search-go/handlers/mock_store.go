package handlers

import (
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"github.com/liaofeng/AIChat/backend/douyin-search-go/models"
)

// MockStore implements db.VideoStore interface for testing
type MockStore struct {
	videos []models.Video
}

// NewMockStore creates a new MockStore with test data
func NewMockStore() *MockStore {
	return &MockStore{
		videos: []models.Video{
			{
				VideoBase: models.VideoBase{
					Title:     "Test Video 1",
					CoverURL:  "https://example.com/cover1.jpg",
					Length:    "1:30",
					Author:    json.RawMessage(`{"name":"Test Author 1"}`),
					Stats:     json.RawMessage(`{"likes":100,"views":1000}`),
					CreatedAt: time.Now().UTC().Format(time.RFC3339),
				},
				ID: "test-id-1",
			},
			{
				VideoBase: models.VideoBase{
					Title:     "Test Video 2",
					CoverURL:  "https://example.com/cover2.jpg",
					Length:    "2:30",
					Author:    json.RawMessage(`{"name":"Test Author 2"}`),
					Stats:     json.RawMessage(`{"likes":200,"views":2000}`),
					CreatedAt: time.Now().UTC().Format(time.RFC3339),
				},
				ID: "test-id-2",
			},
		},
	}
}

// GetVideos implements VideoStore.GetVideos
func (m *MockStore) GetVideos(query, dateFilter, sortBy string, page, perPage int) ([]models.Video, int, error) {
	// Filter videos based on query
	filtered := make([]models.Video, 0)
	for _, v := range m.videos {
		if query == "" || contains(v.Title, query) {
			filtered = append(filtered, v)
		}
	}

	// Calculate pagination
	start := (page - 1) * perPage
	end := start + perPage
	if start >= len(filtered) {
		return []models.Video{}, len(filtered), nil
	}
	if end > len(filtered) {
		end = len(filtered)
	}

	return filtered[start:end], len(filtered), nil
}

// CreateVideo implements VideoStore.CreateVideo
func (m *MockStore) CreateVideo(video *models.VideoBase, id string) error {
	m.videos = append(m.videos, models.Video{
		VideoBase: *video,
		ID:        id,
	})
	return nil
}

// UpdateVideo implements VideoStore.UpdateVideo
func (m *MockStore) UpdateVideo(id string, video *models.VideoBase) error {
	for i, v := range m.videos {
		if v.ID == id {
			m.videos[i] = models.Video{
				VideoBase: *video,
				ID:        id,
			}
			return nil
		}
	}
	return sql.ErrNoRows
}

// DeleteVideo implements VideoStore.DeleteVideo
func (m *MockStore) DeleteVideo(id string) error {
	for i, v := range m.videos {
		if v.ID == id {
			m.videos = append(m.videos[:i], m.videos[i+1:]...)
			return nil
		}
	}
	return sql.ErrNoRows
}

// Helper function to check if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	s, substr = strings.ToLower(s), strings.ToLower(substr)
	return strings.Contains(s, substr)
}

package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/liaofeng/AIChat/backend/douyin-search-go/models"
	"github.com/stretchr/testify/assert"
)

func setupTestHandler() (*Handler, *chi.Mux) {
	mockStore := NewMockStore()
	handler := NewHandler(mockStore)
	
	r := chi.NewRouter()
	r.Get("/api/videos", handler.GetVideos)
	r.Post("/api/videos", handler.CreateVideo)
	r.Put("/api/videos/{id}", handler.UpdateVideo)
	r.Delete("/api/videos/{id}", handler.DeleteVideo)
	r.Get("/healthz", handler.Healthz)
	return handler, r
}

func TestHealthz(t *testing.T) {
	_, r := setupTestHandler()
	req := httptest.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.NewDecoder(w.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])
}

func TestGetVideos(t *testing.T) {
	_, r := setupTestHandler()

	tests := []struct {
		name           string
		query         string
		dateFilter    string
		sortBy        string
		page          string
		perPage       string
		expectedCode  int
		expectedTotal int
	}{
		{
			name:          "Basic pagination",
			query:         "",
			dateFilter:    "",
			sortBy:        "",
			page:         "1",
			perPage:      "10",
			expectedCode: http.StatusOK,
		},
		{
			name:          "With search query",
			query:         "test",
			dateFilter:    "",
			sortBy:        "",
			page:         "1",
			perPage:      "10",
			expectedCode: http.StatusOK,
		},
		{
			name:          "With date filter",
			query:         "",
			dateFilter:    "today",
			sortBy:        "",
			page:         "1",
			perPage:      "10",
			expectedCode: http.StatusOK,
		},
		{
			name:          "With sort by likes",
			query:         "",
			dateFilter:    "",
			sortBy:        "likes",
			page:         "1",
			perPage:      "10",
			expectedCode: http.StatusOK,
		},
		{
			name:          "Invalid page number",
			query:         "",
			dateFilter:    "",
			sortBy:        "",
			page:         "invalid",
			perPage:      "10",
			expectedCode: http.StatusOK, // Should use default page 1
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := "/api/videos?page=" + tt.page +
				"&per_page=" + tt.perPage +
				"&query=" + tt.query +
				"&date_filter=" + tt.dateFilter +
				"&sort_by=" + tt.sortBy

			req := httptest.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)

			var response models.PaginatedResponse
			err := json.NewDecoder(w.Body).Decode(&response)
			assert.NoError(t, err)
			assert.GreaterOrEqual(t, response.Total, 0)
			assert.GreaterOrEqual(t, len(response.Videos), 0)
		})
	}
}

func TestCreateVideo(t *testing.T) {
	_, r := setupTestHandler()

	video := models.VideoBase{
		Title:     "Test Video",
		CoverURL:  "https://example.com/cover.jpg",
		Length:    "1:30",
		Author:    json.RawMessage(`{"name":"Test Author"}`),
		Stats:     json.RawMessage(`{"likes":0,"views":0}`),
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(video)
	assert.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/videos", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.Video
	err = json.NewDecoder(w.Body).Decode(&response)
	assert.NoError(t, err)
	assert.NotEmpty(t, response.ID)
	assert.Equal(t, video.Title, response.Title)
}

func TestUpdateVideo(t *testing.T) {
	_, r := setupTestHandler()

	// First create a video
	video := models.VideoBase{
		Title:     "Test Video",
		CoverURL:  "https://example.com/cover.jpg",
		Length:    "1:30",
		Author:    json.RawMessage(`{"name":"Test Author"}`),
		Stats:     json.RawMessage(`{"likes":0,"views":0}`),
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(video)
	assert.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/videos", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var created models.Video
	err = json.NewDecoder(w.Body).Decode(&created)
	assert.NoError(t, err)

	// Now update the video
	video.Title = "Updated Test Video"
	body, err = json.Marshal(video)
	assert.NoError(t, err)

	req = httptest.NewRequest("PUT", "/api/videos/"+created.ID, bytes.NewBuffer(body))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updated models.Video
	err = json.NewDecoder(w.Body).Decode(&updated)
	assert.NoError(t, err)
	assert.Equal(t, created.ID, updated.ID)
	assert.Equal(t, "Updated Test Video", updated.Title)
}

func TestDeleteVideo(t *testing.T) {
	_, r := setupTestHandler()

	// First create a video
	video := models.VideoBase{
		Title:     "Test Video",
		CoverURL:  "https://example.com/cover.jpg",
		Length:    "1:30",
		Author:    json.RawMessage(`{"name":"Test Author"}`),
		Stats:     json.RawMessage(`{"likes":0,"views":0}`),
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(video)
	assert.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/videos", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var created models.Video
	err = json.NewDecoder(w.Body).Decode(&created)
	assert.NoError(t, err)

	// Now delete the video
	req = httptest.NewRequest("DELETE", "/api/videos/"+created.ID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err = json.NewDecoder(w.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Equal(t, "success", response["status"])
	assert.Equal(t, "Video deleted", response["message"])

	// Try to get the deleted video (should fail)
	req = httptest.NewRequest("GET", "/api/videos", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var listResponse models.PaginatedResponse
	err = json.NewDecoder(w.Body).Decode(&listResponse)
	assert.NoError(t, err)
	
	// Verify the video is not in the list
	found := false
	for _, v := range listResponse.Videos {
		if v.ID == created.ID {
			found = true
			break
		}
	}
	assert.False(t, found, "Deleted video should not be in the list")
}

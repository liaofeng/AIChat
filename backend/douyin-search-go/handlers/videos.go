package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/liaofeng/AIChat/backend/douyin-search-go/db"
	"github.com/liaofeng/AIChat/backend/douyin-search-go/models"
	"github.com/google/uuid"
)

// Handler holds dependencies for video handlers
type Handler struct {
	store db.VideoStore
}

// NewHandler creates a new Handler instance
func NewHandler(store db.VideoStore) *Handler {
	return &Handler{store: store}
}

// writeJSON writes the response as JSON with proper headers
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// GetVideos handles GET /api/videos with filtering, sorting, and pagination
func (h *Handler) GetVideos(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := r.URL.Query().Get("query")
	dateFilter := r.URL.Query().Get("date_filter")
	sortBy := r.URL.Query().Get("sort_by")
	
	// Parse pagination parameters with defaults
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err := strconv.Atoi(r.URL.Query().Get("per_page"))
	if err != nil || perPage < 1 {
		perPage = 10
	}

	// Get videos from database
	videos, total, err := h.store.GetVideos(query, dateFilter, sortBy, page, perPage)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Return paginated response
	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Videos:  videos,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	})
}

// CreateVideo handles POST /api/videos
func (h *Handler) CreateVideo(w http.ResponseWriter, r *http.Request) {
	var video models.VideoBase
	if err := json.NewDecoder(r.Body).Decode(&video); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	// Generate UUID for new video
	id := uuid.New().String()

	// Create video in database
	if err := h.store.CreateVideo(&video, id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Return created video with ID
	writeJSON(w, http.StatusOK, models.Video{
		VideoBase: video,
		ID:        id,
	})
}

// UpdateVideo handles PUT /api/videos/{id}
func (h *Handler) UpdateVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var video models.VideoBase
	if err := json.NewDecoder(r.Body).Decode(&video); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	// Update video in database
	if err := h.store.UpdateVideo(id, &video); err != nil {
		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "Video not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Return updated video
	writeJSON(w, http.StatusOK, models.Video{
		VideoBase: video,
		ID:        id,
	})
}

// DeleteVideo handles DELETE /api/videos/{id}
func (h *Handler) DeleteVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Delete video from database
	if err := h.store.DeleteVideo(id); err != nil {
		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "Video not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "success",
		"message": "Video deleted",
	})
}

// Healthz handles GET /healthz
func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

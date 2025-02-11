package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/liaofeng/AIChat/backend/douyin-search-go/db"
	"github.com/liaofeng/AIChat/backend/douyin-search-go/handlers"
)

func main() {
	// Initialize database
	database, err := db.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.CloseDB(database)

	// Create store and handler
	store := db.NewStore(database)
	handler := handlers.NewHandler(store)

	// Create router
	r := chi.NewRouter()

	// Set up CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Health check endpoint
	r.Get("/healthz", handler.Healthz)

	// Video routes
	r.Route("/api/videos", func(r chi.Router) {
		r.Get("/", handler.GetVideos)
		r.Post("/", handler.CreateVideo)
		r.Put("/{id}", handler.UpdateVideo)
		r.Delete("/{id}", handler.DeleteVideo)
	})

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Start server
	log.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

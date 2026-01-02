package main

import (
	"log"
	"os"

	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/api"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/config"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/fabric"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Fabric client
	fabricClient, err := fabric.NewClient(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize Fabric client: %v", err)
	}
	defer fabricClient.Close()

	// Initialize and start the API server
	server := api.NewServer(cfg, fabricClient)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting CityFlow Parking API server on port %s", port)
	if err := server.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

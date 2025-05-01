// backend/database/db.go
package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// Initialize initializes the database connection and creates tables if they don't exist
func Initialize(dbPath string) error {
	log.Printf("Initializing database at: %s\n", dbPath)

	// Ensure directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Printf("Error creating directory: %v\n", err)
		return err
	}

	var err error
	log.Printf("Opening database connection...\n")
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Printf("Error opening database: %v\n", err)
		return err
	}

	// Test database connection
	if err = DB.Ping(); err != nil {
		log.Printf("Database ping failed: %v\n", err)
		return err
	}

	// Initialize the database schema
	log.Printf("Initializing schema...\n")
	err = InitializeSchema(DB)
	if err != nil {
		log.Printf("Schema initialization failed: %v\n", err)
		return err
	}

	log.Printf("Database initialized successfully\n")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

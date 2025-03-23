// backend/database/db.go
package database

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// Initialize initializes the database connection and creates tables if they don't exist
func Initialize(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// Initialize the database schema
	err = InitializeSchema(DB)
	if err != nil {
		return err
	}

	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// backend/database/models.go
package database

import (
	"database/sql"
	"encoding/json"
	"time"
)

// DatasetType represents the type of dataset
type DatasetType string

const (
	DatasetTypeDEXA      DatasetType = "dexa"
	DatasetTypeBloodwork DatasetType = "bloodwork"
	DatasetTypePaycheck  DatasetType = "paycheck"
	DatasetTypeHabit     DatasetType = "habit"
)

// FieldType represents the type of a field
type FieldType string

const (
	FieldTypeDate       FieldType = "date"
	FieldTypeBoolean    FieldType = "boolean"
	FieldTypeNumber     FieldType = "number"
	FieldTypePercentage FieldType = "percentage"
	FieldTypeText       FieldType = "text"
)

// FieldDefinition defines a field's properties
type FieldDefinition struct {
	Key          string    `json:"key"`
	Type         FieldType `json:"type"`
	DisplayName  string    `json:"displayName"`
	Description  string    `json:"description,omitempty"`
	Unit         string    `json:"unit,omitempty"`
	IsSearchable bool      `json:"isSearchable,omitempty"`
}

// Dataset represents a collection of data with its field definitions
type Dataset struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description,omitempty"`
	Type         DatasetType       `json:"type"`
	Fields       []FieldDefinition `json:"fields"`
	CreatedAt    time.Time         `json:"createdAt"`
	LastModified time.Time         `json:"lastModified"`
}

// DataRecord represents a single record of data
type DataRecord struct {
	ID           string          `json:"id"`
	DatasetID    string          `json:"datasetId"`
	Data         json.RawMessage `json:"data"`
	CreatedAt    time.Time       `json:"createdAt"`
	LastModified time.Time       `json:"lastModified"`
}

// InitializeSchema creates the database tables
func InitializeSchema(db *sql.DB) error {
	// Create datasets table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS datasets (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			type TEXT NOT NULL,
			fields TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL,
			last_modified TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	// Create data_records table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS data_records (
			id TEXT PRIMARY KEY,
			dataset_id TEXT NOT NULL,
			data TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL,
			last_modified TIMESTAMP NOT NULL,
			FOREIGN KEY (dataset_id) REFERENCES datasets (id)
		)
	`)
	if err != nil {
		return err
	}

	return nil
}

// Note: Initialize function has been removed from this file to avoid duplication with db.go
// The proper initialization sequence should be called from db.go's Initialize function

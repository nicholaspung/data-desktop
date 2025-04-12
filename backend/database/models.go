// backend/database/models.go
package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// DatasetType represents the type of dataset
type DatasetType string

const (
	DatasetTypeDEXA       DatasetType = "dexa"
	DatasetTypeBloodwork  DatasetType = "bloodwork"
	DatasetTypeExperiment DatasetType = "experiment"
	DatasetTypeMetric     DatasetType = "metric"
	DatasetTypeDailyLog   DatasetType = "daily_log"
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
	IsOptional   bool      `json:"isOptional,omitempty"`

	// New fields for relationships
	RelatedDataset string `json:"relatedDataset,omitempty"` // ID of the related dataset
	RelatedField   string `json:"relatedField,omitempty"`   // Field to join on in the related dataset
	IsRelation     bool   `json:"isRelation,omitempty"`     // Whether this field is a relation
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

// InitializeRelationships creates tables and indices for relationship fields
func InitializeRelationships(db *sql.DB) error {
	// Create an index for improved join performance on dataset_id
	_, err := db.Exec(`
        CREATE INDEX IF NOT EXISTS idx_data_records_dataset_id ON data_records(dataset_id)
    `)
	if err != nil {
		return err
	}

	// Go through all datasets and check for relation fields
	datasets, err := ListDatasets()
	if err != nil {
		return err
	}

	for _, dataset := range datasets {
		for _, field := range dataset.Fields {
			if field.IsRelation && field.RelatedDataset != "" {
				// Create an index on the JSON field that holds the foreign key
				indexName := fmt.Sprintf("idx_%s_%s", dataset.ID, field.Key)
				indexSQL := fmt.Sprintf(
					"CREATE INDEX IF NOT EXISTS %s ON data_records((json_extract(data, '$.%s'))) WHERE dataset_id = '%s'",
					indexName, field.Key, dataset.ID,
				)

				_, err = db.Exec(indexSQL)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
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

	// Initialize relationship indices and tables
	err = InitializeRelationships(db)
	if err != nil {
		return err
	}

	return nil
}

// Note: Initialize function has been removed from this file to avoid duplication with db.go
// The proper initialization sequence should be called from db.go's Initialize function

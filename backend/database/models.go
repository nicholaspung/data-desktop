package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type DatasetType string

const (
	DatasetTypeDEXA         DatasetType = "dexa"
	DatasetTypeBloodwork    DatasetType = "bloodwork"
	DatasetTypeExperiment   DatasetType = "experiment"
	DatasetTypeMetric       DatasetType = "metric"
	DatasetTypeDailyLog     DatasetType = "daily_log"
	DatasetTypeJournaling   DatasetType = "journaling"
	DatasetTypeTimeTracking DatasetType = "time_tracking"
	DatasetTypeTodo         DatasetType = "todos"
	DatasetTypePeopleCRM    DatasetType = "people_crm"
	DatasetTypeFinancial    DatasetType = "financial"
)

type FieldType string

const (
	FieldTypeDate         FieldType = "date"
	FieldTypeBoolean      FieldType = "boolean"
	FieldTypeNumber       FieldType = "number"
	FieldTypePercentage   FieldType = "percentage"
	FieldTypeText         FieldType = "text"
	FieldTypeMarkdown     FieldType = "markdown"
	FieldTypeJSON         FieldType = "json"
	FieldTypeFile         FieldType = "file"
	FieldTypeFileMultiple FieldType = "file-multiple"
)

type FieldDefinition struct {
	Key          string    `json:"key"`
	Type         FieldType `json:"type"`
	DisplayName  string    `json:"displayName"`
	Description  string    `json:"description,omitempty"`
	Unit         string    `json:"unit,omitempty"`
	IsSearchable bool      `json:"isSearchable,omitempty"`
	IsOptional   bool      `json:"isOptional,omitempty"`
	IsUnique     bool      `json:"isUnique,omitempty"`

	RelatedDataset            string `json:"relatedDataset,omitempty"`
	RelatedField              string `json:"relatedField,omitempty"`
	IsRelation                bool   `json:"isRelation,omitempty"`
	PreventDeleteIfReferenced bool   `json:"preventDeleteIfReferenced,omitempty"`
	CascadeDeleteIfReferenced bool   `json:"cascadeDeleteIfReferenced,omitempty"`
}

type Dataset struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description,omitempty"`
	Type         DatasetType       `json:"type"`
	Fields       []FieldDefinition `json:"fields"`
	CreatedAt    time.Time         `json:"createdAt"`
	LastModified time.Time         `json:"lastModified"`
}

type DatasetConfig struct {
	ID          string
	Name        string
	Description string
	Type        DatasetType
	Fields      []FieldDefinition
}

type DataRecord struct {
	ID           string          `json:"id"`
	DatasetID    string          `json:"datasetId"`
	Data         json.RawMessage `json:"data"`
	CreatedAt    time.Time       `json:"createdAt"`
	LastModified time.Time       `json:"lastModified"`
}

func InitializeRelationships(db *sql.DB) error {
	_, err := db.Exec(`
        CREATE INDEX IF NOT EXISTS idx_data_records_dataset_id ON data_records(dataset_id)
    `)
	if err != nil {
		return err
	}

	datasets, err := ListDatasets()
	if err != nil {
		return err
	}

	for _, dataset := range datasets {
		for _, field := range dataset.Fields {
			if field.IsRelation && field.RelatedDataset != "" {
				indexName := fmt.Sprintf("idx_%s_%s", strings.ReplaceAll(dataset.ID, "-", "_"), field.Key)

				indexSQL := fmt.Sprintf(
					`CREATE INDEX IF NOT EXISTS %s ON data_records((json_extract(data, '$.%s'))) WHERE dataset_id = '%s'`,
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

func InitializeSchema(db *sql.DB) error {
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

	err = InitializeRelationships(db)
	if err != nil {
		return err
	}

	return nil
}

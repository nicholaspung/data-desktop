// backend/api.go
package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"myproject/backend/database"
	_ "myproject/backend/database/models" // Import for side effects to register field functions
	"time"

	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize the database
	err := database.Initialize("./DataDesktop.db")
	if err != nil {
		log.Println("Error initializing database:", err.Error())
		return
	}

	// Sync datasets with the database
	err = database.SyncDatasets()
	if err != nil {
		log.Println("Error synchronizing datasets:", err.Error())
	}
}

// Shutdown is called when the app is about to quit
func (a *App) Shutdown(ctx context.Context) {
	database.Close()
}

// ---- Dataset API Methods ----

// GetDatasets returns all datasets
func (a *App) GetDatasets() ([]database.Dataset, error) {
	return database.ListDatasets()
}

// GetDataset returns a dataset by ID
func (a *App) GetDataset(id string) (database.Dataset, error) {
	return database.GetDataset(id)
}

// CreateDataset creates a new dataset
func (a *App) CreateDataset(name string, description string, datasetType string, fields string) (database.Dataset, error) {
	var fieldDefs []database.FieldDefinition
	err := json.Unmarshal([]byte(fields), &fieldDefs)
	if err != nil {
		return database.Dataset{}, err
	}

	dataset := database.Dataset{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
		Type:        database.DatasetType(datasetType),
		Fields:      fieldDefs,
		CreatedAt:   time.Now(),
	}

	err = database.CreateDataset(dataset)
	if err != nil {
		return database.Dataset{}, err
	}

	return dataset, nil
}

// UpdateDataset updates an existing dataset
func (a *App) UpdateDataset(id string, name string, description string, fields string) (database.Dataset, error) {
	dataset, err := database.GetDataset(id)
	if err != nil {
		return database.Dataset{}, err
	}

	// Update fields if provided
	if fields != "" {
		var fieldDefs []database.FieldDefinition
		err = json.Unmarshal([]byte(fields), &fieldDefs)
		if err != nil {
			return database.Dataset{}, err
		}
		dataset.Fields = fieldDefs
	}

	// Update other properties
	dataset.Name = name
	dataset.Description = description

	err = database.UpdateDataset(dataset)
	if err != nil {
		return database.Dataset{}, err
	}

	return dataset, nil
}

// DeleteDataset deletes a dataset and all its records
func (a *App) DeleteDataset(id string) error {
	return database.DeleteDataset(id)
}

// ---- Data Records API Methods ----

// GetRecords returns all records for a dataset
func (a *App) GetRecords(datasetID string) ([]map[string]interface{}, error) {
	records, err := database.GetDataRecords(datasetID)
	if err != nil {
		return nil, err
	}

	// Parse the JSON data into a map
	result := make([]map[string]interface{}, len(records))
	for i, record := range records {
		var data map[string]interface{}
		err = json.Unmarshal(record.Data, &data)
		if err != nil {
			return nil, err
		}

		// Add metadata
		data["id"] = record.ID
		data["createdAt"] = record.CreatedAt
		data["lastModified"] = record.LastModified

		result[i] = data
	}

	return result, nil
}

// GetRecord returns a single record
func (a *App) GetRecord(id string) (map[string]interface{}, error) {
	record, err := database.GetDataRecord(id)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	err = json.Unmarshal(record.Data, &data)
	if err != nil {
		return nil, err
	}

	// Add metadata
	data["id"] = record.ID
	data["datasetId"] = record.DatasetID
	data["createdAt"] = record.CreatedAt
	data["lastModified"] = record.LastModified

	return data, nil
}

// AddRecord adds a new record
func (a *App) AddRecord(datasetID string, data string) (map[string]interface{}, error) {
	// Validate the dataset exists
	_, err := database.GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	// Create the record
	record := database.DataRecord{
		ID:        uuid.New().String(),
		DatasetID: datasetID,
		Data:      json.RawMessage(data),
	}

	err = database.AddDataRecord(record)
	if err != nil {
		return nil, err
	}

	// Return the record with metadata
	return a.GetRecord(record.ID)
}

// UpdateRecord updates an existing record
func (a *App) UpdateRecord(id string, data string) (map[string]interface{}, error) {
	// Get the existing record
	record, err := database.GetDataRecord(id)
	if err != nil {
		return nil, err
	}

	// Update the data
	record.Data = json.RawMessage(data)

	err = database.UpdateDataRecord(record)
	if err != nil {
		return nil, err
	}

	// Return the updated record
	return a.GetRecord(id)
}

// DeleteRecord deletes a record
func (a *App) DeleteRecord(id string) error {
	return database.DeleteDataRecord(id)
}

// ImportRecords imports multiple records for a dataset
func (a *App) ImportRecords(datasetID string, records string) (int, error) {
	// Validate the dataset exists
	_, err := database.GetDataset(datasetID)
	if err != nil {
		return 0, err
	}

	// Parse the JSON records
	var recordsData []map[string]interface{}
	err = json.Unmarshal([]byte(records), &recordsData)
	if err != nil {
		return 0, err
	}

	// Create database records
	dbRecords := make([]database.DataRecord, len(recordsData))
	for i, data := range recordsData {
		dataJSON, err := json.Marshal(data)
		if err != nil {
			return 0, err
		}

		dbRecords[i] = database.DataRecord{
			ID:        uuid.New().String(),
			DatasetID: datasetID,
			Data:      dataJSON,
		}
	}

	// Import the records
	err = database.ImportRecords(dbRecords)
	if err != nil {
		return 0, err
	}

	return len(dbRecords), nil
}

// GetRelatedRecords gets data with support for relations
func (a *App) GetRelatedRecords(datasetID string, relationsJSON string) ([]map[string]interface{}, error) {
	// Parse relations from JSON
	var relations map[string]string
	if relationsJSON != "" {
		err := json.Unmarshal([]byte(relationsJSON), &relations)
		if err != nil {
			return nil, fmt.Errorf("invalid relations format: %w", err)
		}
	}

	// Call the repository function
	return database.GetDataRecordsWithRelations(datasetID, relations)
}

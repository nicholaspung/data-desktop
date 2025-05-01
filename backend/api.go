// backend/api.go
package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"myproject/backend/database"
	_ "myproject/backend/database/models" // Import for side effects to register field functions
	"os"
	"path/filepath"
	"runtime"
	"strings"
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

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Get the app directory for storing the database
	appDir, err := getAppDataDir()
	if err != nil {
		log.Println("Error getting app data directory:", err.Error())
		return
	}

	// Define database path based on environment
	var dbPath string

	// Check if running in development mode by checking the executable path
	executable, err := os.Executable()
	if err == nil {
		executableName := filepath.Base(executable)
		// In dev mode with 'wails dev', the executable is typically not the final app name
		// This is a more reliable way to detect dev mode
		isDev := strings.Contains(executableName, "wails-") || strings.Contains(executableName, "__debug_bin") || os.Getenv("BUILD_MODE") == "dev"

		if isDev {
			log.Println("Running in development mode (detected via executable name):", executableName)
			dbPath = filepath.Join(appDir, "DataDesktop-dev.db")
		} else {
			log.Println("Running in production mode with executable:", executableName)
			dbPath = filepath.Join(appDir, "DataDesktop.db")
		}
	} else {
		// Fallback to just checking environment variable
		if os.Getenv("BUILD_MODE") == "dev" {
			log.Println("Running in development mode (detected via environment variable)")
			dbPath = filepath.Join(appDir, "DataDesktop-dev.db")
		} else {
			log.Println("Running in production mode (fallback)")
			dbPath = filepath.Join(appDir, "DataDesktop.db")
		}
	}

	log.Printf("Using database path: %s", dbPath)

	// Initialize the database
	err = database.Initialize(dbPath)
	if err != nil {
		log.Println("Error initializing database:", err.Error())
		return
	}

	// Sync datasets with the database
	err = database.SyncDatasets()
	if err != nil {
		log.Println("Error synchronizing datasets:", err.Error())
	}

	// Clean up unused tables (optional)
	err = database.CleanupUnusedTables()
	if err != nil {
		log.Println("Error cleaning up unused tables:", err.Error())
	}
}

// Helper function to get the appropriate app data directory
func getAppDataDir() (string, error) {
	var appDir string

	if runtime.GOOS == "darwin" {
		// For macOS, use Application Support
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, "Library", "Application Support", "DataDesktop")
	} else if runtime.GOOS == "windows" {
		// For Windows, use AppData
		appDir = filepath.Join(os.Getenv("APPDATA"), "DataDesktop")
	} else {
		// For Linux and others, use ~/.config
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, ".config", "DataDesktop")
	}

	// Ensure directory exists with proper permissions
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}

	return appDir, nil
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

func (a *App) updateMetricLastOccurrence(metricID string, logDate time.Time) error {
	// First, get the metric record
	metricRecord, err := database.GetDataRecord(metricID)
	if err != nil {
		return err
	}

	// Parse the metric data
	var metricData map[string]interface{}
	err = json.Unmarshal(metricRecord.Data, &metricData)
	if err != nil {
		return err
	}

	// Check if this is an interval-based metric
	frequency, _ := metricData["schedule_frequency"].(string)
	if frequency != "interval" {
		return nil // Not an interval metric, nothing to update
	}

	// Update the last occurrence date
	metricData["schedule_last_occurrence"] = logDate.Format(time.RFC3339)

	// Save the updated metric
	updatedData, err := json.Marshal(metricData)
	if err != nil {
		return err
	}

	metricRecord.Data = updatedData
	return database.UpdateDataRecord(metricRecord)
}

// Now modify the AddRecord method to handle daily logs specifically
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

	// Special handling for daily logs to update the metric's last occurrence
	if datasetID == "daily_logs" {
		// Parse the log data
		var logData map[string]interface{}
		err = json.Unmarshal(record.Data, &logData)
		if err != nil {
			return nil, err
		}

		// Check if this log has a metric_id
		if metricID, ok := logData["metric_id"].(string); ok {
			// Parse the log date
			var logDate time.Time
			if dateStr, ok := logData["date"].(string); ok {
				logDate, err = time.Parse(time.RFC3339, dateStr)
				if err != nil {
					// Try other date formats
					logDate, err = time.Parse("2006-01-02", dateStr)
					if err != nil {
						// Just use current time if we can't parse the date
						logDate = time.Now()
					}
				}
			} else {
				logDate = time.Now()
			}

			// Update the metric's last occurrence
			a.updateMetricLastOccurrence(metricID, logDate)
		}
	}

	// Return the record with metadata
	return a.GetRecord(record.ID)
}

// Similarly update the UpdateRecord method
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

	// Special handling for daily logs to update the metric's last occurrence
	if record.DatasetID == "daily_logs" {
		// Parse the log data
		var logData map[string]interface{}
		err = json.Unmarshal(record.Data, &logData)
		if err != nil {
			return nil, err
		}

		// Check if this log has a metric_id
		if metricID, ok := logData["metric_id"].(string); ok {
			// Parse the log date
			var logDate time.Time
			if dateStr, ok := logData["date"].(string); ok {
				logDate, err = time.Parse(time.RFC3339, dateStr)
				if err != nil {
					// Try other date formats
					logDate, err = time.Parse("2006-01-02", dateStr)
					if err != nil {
						// Just use current time if we can't parse the date
						logDate = time.Now()
					}
				}
			} else {
				logDate = time.Now()
			}

			// Update the metric's last occurrence
			a.updateMetricLastOccurrence(metricID, logDate)
		}
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

// GetRecordsWithRelations returns all records for a dataset with related data included
func (a *App) GetRecordsWithRelations(datasetID string) ([]map[string]interface{}, error) {
	// Get the dataset to find relation fields
	dataset, err := database.GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	// Build a map of relations
	relations := make(map[string]string)
	for _, field := range dataset.Fields {
		if field.IsRelation && field.RelatedDataset != "" {
			// Use the field key as both key and alias
			relations[field.Key] = field.Key
		}
	}

	// If no relations, just return regular records
	if len(relations) == 0 {
		return a.GetRecords(datasetID)
	}

	// Get records with relations
	return database.GetDataRecordsWithRelations(datasetID, relations)
}

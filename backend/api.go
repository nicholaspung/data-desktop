package backend

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"myproject/backend/database"
	_ "myproject/backend/database/models"
	"myproject/backend/image"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/google/uuid"
)

type App struct {
	ctx        context.Context
	appDataDir string
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	appDir, err := getAppDataDir()
	if err != nil {
		log.Println("Error getting app data directory:", err.Error())
		return
	}

	a.appDataDir = appDir

	err = image.Initialize(appDir)
	if err != nil {
		log.Println("Error initializing image directory:", err.Error())
		return
	}

	image.InitializeCache()

	var dbPath string

	executable, err := os.Executable()
	if err == nil {
		executableName := filepath.Base(executable)
		isDev := strings.Contains(executableName, "wails-") || strings.Contains(executableName, "__debug_bin") || os.Getenv("BUILD_MODE") == "dev"

		if isDev {
			log.Println("Running in development mode (detected via executable name):", executableName)
			dbPath = filepath.Join(appDir, "DatingDesktop-dev.db")
		} else {
			log.Println("Running in production mode with executable:", executableName)
			dbPath = filepath.Join(appDir, "DatingDesktop.db")
		}
	} else {
		if os.Getenv("BUILD_MODE") == "dev" {
			log.Println("Running in development mode (detected via environment variable)")
			dbPath = filepath.Join(appDir, "DatingDesktop-dev.db")
		} else {
			log.Println("Running in production mode (fallback)")
			dbPath = filepath.Join(appDir, "DatingDesktop.db")
		}
	}

	log.Printf("Using database path: %s", dbPath)

	err = database.Initialize(dbPath)
	if err != nil {
		log.Println("Error initializing database:", err.Error())
		return
	}

	err = database.SyncDatasets()
	if err != nil {
		log.Println("Error synchronizing datasets:", err.Error())
	}

	err = database.CleanupUnusedTables()
	if err != nil {
		log.Println("Error cleaning up unused tables:", err.Error())
	}
}

func getAppDataDir() (string, error) {
	var appDir string

	if runtime.GOOS == "darwin" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, "Library", "Application Support", "DatingDesktop")
	} else if runtime.GOOS == "windows" {
		appDir = filepath.Join(os.Getenv("APPDATA"), "DatingDesktop")
	} else {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, ".config", "DatingDesktop")
	}

	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}

	return appDir, nil
}

func (a *App) Shutdown(ctx context.Context) {
	database.Close()
}

func (a *App) UploadImage(base64Image string, prefix string) (string, error) {
	if base64Image == "" {
		return "", nil
	}

	return image.SaveImage(a.appDataDir, base64Image, prefix)
}

func (a *App) GetImagePath(relativePath string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	fullPath := image.GetImagePath(a.appDataDir, relativePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("image does not exist")
	}

	return fullPath, nil
}

func (a *App) GetDatasets() ([]database.Dataset, error) {
	return database.ListDatasets()
}

func (a *App) GetDataset(id string) (database.Dataset, error) {
	return database.GetDataset(id)
}

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

func (a *App) UpdateDataset(id string, name string, description string, fields string) (database.Dataset, error) {
	dataset, err := database.GetDataset(id)
	if err != nil {
		return database.Dataset{}, err
	}

	if fields != "" {
		var fieldDefs []database.FieldDefinition
		err = json.Unmarshal([]byte(fields), &fieldDefs)
		if err != nil {
			return database.Dataset{}, err
		}
		dataset.Fields = fieldDefs
	}

	dataset.Name = name
	dataset.Description = description

	err = database.UpdateDataset(dataset)
	if err != nil {
		return database.Dataset{}, err
	}

	return dataset, nil
}

func (a *App) DeleteDataset(id string) error {
	return database.DeleteDataset(id)
}

func (a *App) GetRecords(datasetID string) ([]map[string]interface{}, error) {
	records, err := database.GetDataRecords(datasetID)
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, len(records))
	for i, record := range records {
		var data map[string]interface{}
		err = json.Unmarshal(record.Data, &data)
		if err != nil {
			return nil, err
		}

		data["id"] = record.ID
		data["datasetId"] = record.DatasetID
		data["createdAt"] = record.CreatedAt
		data["lastModified"] = record.LastModified

		// Use thumbnails for record listings
		image.ProcessRecord(a.appDataDir, data, true)

		result[i] = data
	}

	return result, nil
}

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

	data["id"] = record.ID
	data["datasetId"] = record.DatasetID
	data["createdAt"] = record.CreatedAt
	data["lastModified"] = record.LastModified

	// For single record view, use full resolution
	image.ProcessRecord(a.appDataDir, data, false)

	return data, nil
}

func (a *App) updateMetricLastOccurrence(metricID string, logDate time.Time) error {
	metricRecord, err := database.GetDataRecord(metricID)
	if err != nil {
		return err
	}

	var metricData map[string]interface{}
	err = json.Unmarshal(metricRecord.Data, &metricData)
	if err != nil {
		return err
	}

	frequency, _ := metricData["schedule_frequency"].(string)
	if frequency != "interval" {
		return nil
	}

	metricData["schedule_last_occurrence"] = logDate.Format(time.RFC3339)

	updatedData, err := json.Marshal(metricData)
	if err != nil {
		return err
	}

	metricRecord.Data = updatedData
	return database.UpdateDataRecord(metricRecord)
}

func (a *App) AddRecord(datasetID string, data string) (map[string]interface{}, error) {
	_, err := database.GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	var recordData map[string]interface{}
	err = json.Unmarshal([]byte(data), &recordData)
	if err != nil {
		return nil, err
	}

	processedData, err := a.SaveImages(recordData, datasetID)
	if err != nil {
		return nil, fmt.Errorf("failed to process images: %w", err)
	}

	processedJSON, err := json.Marshal(processedData)
	if err != nil {
		return nil, err
	}

	record := database.DataRecord{
		ID:        uuid.New().String(),
		DatasetID: datasetID,
		Data:      json.RawMessage(processedJSON),
	}

	err = database.AddDataRecord(record)
	if err != nil {
		return nil, err
	}

	if datasetID == "daily_logs" {
		var logData map[string]interface{}
		err = json.Unmarshal(record.Data, &logData)
		if err != nil {
			return nil, err
		}

		if metricID, ok := logData["metric_id"].(string); ok {
			var logDate time.Time
			if dateStr, ok := logData["date"].(string); ok {
				logDate, err = time.Parse(time.RFC3339, dateStr)
				if err != nil {
					logDate, err = time.Parse("2006-01-02", dateStr)
					if err != nil {
						logDate = time.Now()
					}
				}
			} else {
				logDate = time.Now()
			}

			a.updateMetricLastOccurrence(metricID, logDate)
		}
	}

	return a.GetRecord(record.ID)
}

func (a *App) UpdateRecord(id string, data string) (map[string]interface{}, error) {
	record, err := database.GetDataRecord(id)
	if err != nil {
		return nil, err
	}

	var oldData map[string]interface{}
	err = json.Unmarshal(record.Data, &oldData)
	if err != nil {
		return nil, err
	}

	var newData map[string]interface{}
	err = json.Unmarshal([]byte(data), &newData)
	if err != nil {
		return nil, err
	}

	processedData, err := a.processDataWithExistingImages(oldData, newData, record.DatasetID)
	if err != nil {
		return nil, fmt.Errorf("failed to process images: %w", err)
	}

	processedJSON, err := json.Marshal(processedData)
	if err != nil {
		return nil, err
	}

	record.Data = processedJSON
	record.LastModified = time.Now()

	err = database.UpdateDataRecord(record)
	if err != nil {
		return nil, err
	}

	return a.GetRecord(id)
}

func (a *App) DeleteRecord(id string) error {
	return database.DeleteDataRecord(id)
}

func (a *App) ImportRecords(datasetID string, records string) (int, error) {
	_, err := database.GetDataset(datasetID)
	if err != nil {
		return 0, err
	}

	var recordsData []map[string]interface{}
	err = json.Unmarshal([]byte(records), &recordsData)
	if err != nil {
		return 0, err
	}

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

	err = database.ImportRecords(dbRecords)
	if err != nil {
		return 0, err
	}

	return len(dbRecords), nil
}

func (a *App) GetRelatedRecords(datasetID string, relationsJSON string) ([]map[string]interface{}, error) {
	var relations map[string]string
	if relationsJSON != "" {
		err := json.Unmarshal([]byte(relationsJSON), &relations)
		if err != nil {
			return nil, fmt.Errorf("invalid relations format: %w", err)
		}
	}

	return database.GetDataRecordsWithRelations(datasetID, relations)
}

func (a *App) GetRecordsWithRelations(datasetID string) ([]map[string]interface{}, error) {
	dataset, err := database.GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	relations := make(map[string]string)
	for _, field := range dataset.Fields {
		if field.IsRelation && field.RelatedDataset != "" {
			relations[field.Key] = field.Key
		}
	}

	if len(relations) == 0 {
		return a.GetRecords(datasetID)
	}

	result, err := database.GetDataRecordsWithRelations(datasetID, nil)
	if err != nil {
		return nil, err
	}

	for _, record := range result {
		image.ProcessRecord(a.appDataDir, record, true)
	}

	return result, nil
}

func (a *App) GetImage(imagePath string) (string, error) {
	if imagePath == "" {
		return "", nil
	}

	fullPath := image.GetImagePath(a.appDataDir, imagePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("image does not exist")
	}

	data, err := ioutil.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}

	ext := strings.ToLower(filepath.Ext(imagePath))
	var contentType string
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".gif":
		contentType = "image/gif"
	case ".webp":
		contentType = "image/webp"
	default:
		contentType = "application/octet-stream"
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	return "data:" + contentType + ";base64," + base64Data, nil
}

func (a *App) SaveImages(data interface{}, prefix string) (interface{}, error) {
	return a.processImagesRecursive(data, prefix)
}

func (a *App) processImagesRecursive(data interface{}, prefix string) (interface{}, error) {
	switch v := data.(type) {
	case map[string]interface{}:
		for key, value := range v {
			processed, err := a.processImagesRecursive(value, prefix+"-"+key)
			if err != nil {
				return nil, err
			}
			v[key] = processed
		}
		return v, nil

	case []interface{}:
		for i, item := range v {
			processed, err := a.processImagesRecursive(item, fmt.Sprintf("%s-%d", prefix, i))
			if err != nil {
				return nil, err
			}
			v[i] = processed
		}
		return v, nil

	case string:
		if strings.HasPrefix(v, "data:image/") {
			imagePath, err := a.UploadImage(v, prefix)
			if err != nil {
				return nil, err
			}
			return imagePath, nil
		}
		return v, nil

	default:
		return data, nil
	}
}

func (a *App) processDataWithExistingImages(oldData, newData map[string]interface{}, prefix string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for key, newValue := range newData {

		switch v := newValue.(type) {
		case map[string]interface{}:
			oldNested, ok := oldData[key].(map[string]interface{})
			if !ok {
				oldNested = map[string]interface{}{}
			}

			processed, err := a.processDataWithExistingImages(oldNested, v, prefix+"-"+key)
			if err != nil {
				return nil, err
			}
			result[key] = processed

		case []interface{}:

			if isImageArray(v) {

				processedArray, err := a.processImageArray(v, prefix+"-"+key)
				if err != nil {
					return nil, err
				}
				result[key] = processedArray
			} else {

				processedArray, err := a.processGenericArray(v, prefix+"-"+key)
				if err != nil {
					return nil, err
				}
				result[key] = processedArray
			}

		case string:

			if strings.HasPrefix(v, "data:image/") {

				imagePath, err := a.UploadImage(v, prefix+"-"+key)
				if err != nil {
					return nil, err
				}

				if oldImagePath, ok := oldData[key].(string); ok && oldImagePath != "" && !strings.HasPrefix(oldImagePath, "data:image/") {

					_ = image.DeleteImage(a.appDataDir, oldImagePath)
				}

				result[key] = imagePath
			} else {
				result[key] = v
			}

		default:
			result[key] = newValue
		}
	}

	for key, oldValue := range oldData {
		if _, exists := result[key]; !exists {
			result[key] = oldValue
		}
	}

	return result, nil
}

func isImageArray(arr []interface{}) bool {
	if len(arr) == 0 {
		return false
	}

	if obj, ok := arr[0].(map[string]interface{}); ok {

		_, hasSrc := obj["src"]
		return hasSrc
	}

	return false
}

func (a *App) processImageArray(arr []interface{}, prefix string) ([]interface{}, error) {
	result := make([]interface{}, len(arr))

	for i, item := range arr {
		if obj, ok := item.(map[string]interface{}); ok {

			if src, ok := obj["src"].(string); ok && strings.HasPrefix(src, "data:image/") {
				imagePath, err := a.UploadImage(src, fmt.Sprintf("%s-%d", prefix, i))
				if err != nil {
					return nil, err
				}
				obj["src"] = imagePath
			}
			result[i] = obj
		} else {
			result[i] = item
		}
	}

	return result, nil
}

func (a *App) processGenericArray(arr []interface{}, prefix string) ([]interface{}, error) {
	result := make([]interface{}, len(arr))

	for i, item := range arr {
		processed, err := a.processImagesRecursive(item, fmt.Sprintf("%s-%d", prefix, i))
		if err != nil {
			return nil, err
		}
		result[i] = processed
	}

	return result, nil
}

func (a *App) GetImageWithSize(relativePath string, size string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	var imageSize *image.Size
	switch size {
	case "thumbnail":
		s := image.ThumbnailSize
		imageSize = &s
	case "medium":
		s := image.MediumSize
		imageSize = &s
	case "original":
		imageSize = nil
	default:
		imageSize = nil
	}

	return image.GetImageAsBase64(a.appDataDir, relativePath, imageSize)
}

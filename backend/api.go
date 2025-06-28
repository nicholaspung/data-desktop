package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"myproject/backend/database"
	"myproject/backend/file"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Todo status constants to match frontend enum
const (
	TodoStatusNotStarted = "not_started"
	TodoStatusInProgress = "in_progress"
	TodoStatusCompleted  = "completed"
	TodoStatusOverdue    = "overdue"
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
		return
	}

	a.appDataDir = appDir

	err = file.Initialize(appDir)
	if err != nil {
		return
	}

	var dbPath string
	var isDev bool

	executable, err := os.Executable()
	if err == nil {
		executableName := filepath.Base(executable)
		isDev = strings.Contains(executableName, "wails-") || strings.Contains(executableName, "__debug_bin") || os.Getenv("BUILD_MODE") == "dev"

		if isDev {
			dbPath = filepath.Join(appDir, "DataDesktop-dev.db")
		} else {
			dbPath = filepath.Join(appDir, "DataDesktop.db")
		}
	} else {
		if os.Getenv("BUILD_MODE") == "dev" {
			isDev = true
			dbPath = filepath.Join(appDir, "DataDesktop-dev.db")
		} else {
			isDev = false
			dbPath = filepath.Join(appDir, "DataDesktop.db")
		}
	}


	err = database.Initialize(dbPath)
	if err != nil {
		return
	}

	err = database.SyncDatasets()
	if err != nil {
		return
	}

	err = database.CleanupUnusedTables()
	if err != nil {
		return
	}

	// Run data migrations for both dev and production
	err = a.MigrateTodoStatusValues()
	if err != nil {
		return
	}

	if isDev {
		err = database.LoadSampleDataOnce()
		if err != nil {
			return
		}

		err = database.FixStringToNumberData()
		if err != nil {
			return
		}
	}
}

func getAppDataDir() (string, error) {
	var appDir string

	if runtime.GOOS == "darwin" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, "Library", "Application Support", "DataDesktop")
	} else if runtime.GOOS == "windows" {
		appDir = filepath.Join(os.Getenv("APPDATA"), "DataDesktop")
	} else {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		appDir = filepath.Join(homeDir, ".config", "DataDesktop")
	}

	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}

	return appDir, nil
}

func (a *App) Shutdown(ctx context.Context) {
	database.Close()
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

func (a *App) GetRecords(datasetID string, fetchImages bool) ([]map[string]interface{}, error) {
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

		result[i] = data
	}

	return result, nil
}

func (a *App) GetRecord(id string, fetchRelatedData bool, fetchImages bool) (map[string]interface{}, error) {
	record, err := database.GetDataRecord(id, fetchRelatedData)
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

	return data, nil
}

func (a *App) updateMetricLastOccurrence(metricID string, logDate time.Time) error {
	metricRecord, err := database.GetDataRecord(metricID, false)
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

func (a *App) AddRecord(datasetID string, data string, fetchFiles bool) (map[string]interface{}, error) {
	_, err := database.GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	var recordData map[string]interface{}
	err = json.Unmarshal([]byte(data), &recordData)
	if err != nil {
		return nil, err
	}

	processedData, err := a.SaveFiles(recordData, datasetID)
	if err != nil {
		return nil, fmt.Errorf("failed to process files: %w", err)
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

	return a.GetRecord(record.ID, true, fetchFiles)
}

func (a *App) UpdateRecord(id string, data string, fetchRelatedData bool, fetchFiles bool) (map[string]interface{}, error) {
	record, err := database.GetDataRecord(id, fetchRelatedData)
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

	processedData, err := a.processDataWithExistingFiles(oldData, newData, record.DatasetID)
	if err != nil {
		return nil, fmt.Errorf("failed to process files: %w", err)
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

	return a.GetRecord(id, fetchRelatedData, fetchFiles)
}

func (a *App) DeleteRecord(id string) error {
	recordData, err := database.DeleteDataRecord(id)
	if err != nil {
		return err
	}

	var data map[string]interface{}
	err = json.Unmarshal(recordData, &data)
	if err == nil {
		a.deleteFilesInData(data)
	}

	return nil
}

func (a *App) deleteFilesInData(data map[string]interface{}) {
	for _, value := range data {
		switch v := value.(type) {
		case string:
			if isFilePath(v) {
				file.DeleteFile(a.appDataDir, v)
			}
		case map[string]interface{}:
			if src, hasSrc := v["src"].(string); hasSrc {
				if isFilePath(src) {
					file.DeleteFile(a.appDataDir, src)
				}
			}
			a.deleteFilesInData(v)
		case []interface{}:
			for _, item := range v {
				if m, ok := item.(map[string]interface{}); ok {
					if src, hasSrc := m["src"].(string); hasSrc {
						if isFilePath(src) {
							file.DeleteFile(a.appDataDir, src)
						}
					}
					a.deleteFilesInData(m)
				} else if s, ok := item.(string); ok {
					if isFilePath(s) {
						file.DeleteFile(a.appDataDir, s)
					}
				}
			}
		}
	}
}

type DuplicateResult struct {
	ImportRecord    map[string]interface{}   `json:"importRecord"`
	ExistingRecords []map[string]interface{} `json:"existingRecords"`
	DuplicateFields []string                 `json:"duplicateFields"`
	Confidence      float64                  `json:"confidence"`
}

func (a *App) CheckForDuplicates(datasetID string, records string, duplicateFields []string) ([]DuplicateResult, error) {
	var recordsData []map[string]interface{}
	err := json.Unmarshal([]byte(records), &recordsData)
	if err != nil {
		return nil, err
	}

	existingRecords, err := database.GetDataRecords(datasetID)
	if err != nil {
		return nil, err
	}

	var duplicates []DuplicateResult

	for _, importRecord := range recordsData {
		var matchingRecords []map[string]interface{}
		var matchedFields []string

		checkFields := duplicateFields
		if len(checkFields) == 0 {

			for key := range importRecord {

				if key != "id" && key != "datasetId" && key != "createdAt" && key != "lastModified" {
					checkFields = append(checkFields, key)
				}
			}
		}

		for _, existing := range existingRecords {
			var existingData map[string]interface{}
			err := json.Unmarshal(existing.Data, &existingData)
			if err != nil {
				continue
			}

			matchedCount := 0
			currentMatchedFields := []string{}

			for _, fieldKey := range checkFields {
				importValue := importRecord[fieldKey]
				existingValue := existingData[fieldKey]

				if importValue != nil && existingValue != nil {

					importStr := fmt.Sprintf("%v", importValue)
					existingStr := fmt.Sprintf("%v", existingValue)

					if importStr == existingStr {
						matchedCount++
						currentMatchedFields = append(currentMatchedFields, fieldKey)
					}
				}
			}

			if matchedCount == len(checkFields) && matchedCount > 0 {

				existingData["id"] = existing.ID
				existingData["datasetId"] = existing.DatasetID
				existingData["createdAt"] = existing.CreatedAt
				existingData["lastModified"] = existing.LastModified

				matchingRecords = append(matchingRecords, existingData)
				matchedFields = currentMatchedFields
			}
		}

		if len(matchingRecords) > 0 {
			duplicates = append(duplicates, DuplicateResult{
				ImportRecord:    importRecord,
				ExistingRecords: matchingRecords,
				DuplicateFields: matchedFields,
				Confidence:      1.0,
			})
		}
	}

	return duplicates, nil
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

func (a *App) GetRecordsWithRelations(datasetID string, fetchImages bool) ([]map[string]interface{}, error) {
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
		return a.GetRecords(datasetID, fetchImages)
	}

	result, err := database.GetDataRecordsWithRelations(datasetID, relations)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (a *App) processGenericArray(arr []interface{}, prefix string) ([]interface{}, error) {
	result := make([]interface{}, len(arr))

	for i, item := range arr {
		processed, err := a.processFilesRecursive(item, fmt.Sprintf("%s-%d", prefix, i))
		if err != nil {
			return nil, err
		}
		result[i] = processed
	}

	return result, nil
}

func (a *App) UploadFile(base64File string, prefix string, fileName string) (string, error) {
	if base64File == "" {
		return "", nil
	}

	return file.SaveFile(a.appDataDir, base64File, prefix, fileName)
}

func (a *App) GetFilePath(relativePath string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	fullPath := file.GetFilePath(a.appDataDir, relativePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("file does not exist")
	}

	return fullPath, nil
}

func (a *App) GetFileAsBase64(relativePath string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	return file.GetFileAsBase64(a.appDataDir, relativePath)
}

func (a *App) DeleteFile(relativePath string) error {
	return file.DeleteFile(a.appDataDir, relativePath)
}

func (a *App) ProcessRecord(record map[string]interface{}, fetchFiles bool) error {
	if fetchFiles {
		for key, value := range record {
			if filePath, ok := value.(string); ok && isFilePath(filePath) {
				base64File, err := file.GetFileAsBase64(a.appDataDir, filePath)
				if err == nil {
					record[key] = base64File
				}
			}
		}
	}

	return nil
}

func (a *App) UploadFileWithName(base64File string, prefix string, fileName string) (string, error) {
	if base64File == "" {
		return "", nil
	}

	return file.SaveFile(a.appDataDir, base64File, prefix, fileName)
}

func (a *App) SaveFiles(data interface{}, prefix string) (interface{}, error) {
	return a.processFilesRecursive(data, prefix)
}

func (a *App) processFilesRecursive(data interface{}, prefix string) (interface{}, error) {
	switch v := data.(type) {
	case map[string]interface{}:
		for key, value := range v {
			processed, err := a.processFilesRecursive(value, prefix+"-"+key)
			if err != nil {
				return nil, err
			}
			v[key] = processed
		}
		return v, nil

	case []interface{}:
		for i, item := range v {
			processed, err := a.processFilesRecursive(item, fmt.Sprintf("%s-%d", prefix, i))
			if err != nil {
				return nil, err
			}
			v[i] = processed
		}
		return v, nil

	case string:
		if strings.HasPrefix(v, "data:") {
			if fileMap, isFileObj := tryParseFileObject(v); isFileObj {
				fileName := fileMap["fileName"].(string)
				content := fileMap["content"].(string)
				filePath, err := a.UploadFileWithName(content, prefix, fileName)
				if err != nil {
					return nil, err
				}
				return filePath, nil
			}
			filePath, err := a.UploadFileWithName(v, prefix, "")
			if err != nil {
				return nil, err
			}
			return filePath, nil
		}
		return v, nil

	default:
		return data, nil
	}
}

func tryParseFileObject(s string) (map[string]interface{}, bool) {
	if !strings.HasPrefix(s, "{") {
		return nil, false
	}

	var fileObj map[string]interface{}
	err := json.Unmarshal([]byte(s), &fileObj)
	if err != nil {
		return nil, false
	}

	_, hasContent := fileObj["content"]
	fileName, hasFileName := fileObj["fileName"]

	if hasContent && hasFileName && fileName != "" {
		return fileObj, true
	}

	return nil, false
}

func (a *App) ProcessRecordWithFiles(record map[string]interface{}, fetchFiles bool) error {
	if fetchFiles {
		for key, value := range record {
			if filePath, ok := value.(string); ok && isFilePath(filePath) {
				base64File, err := file.GetFileAsBase64(a.appDataDir, filePath)
				if err == nil {
					record[key] = base64File
				}
			}

			if array, ok := value.([]interface{}); ok {
				for i, item := range array {
					if itemMap, ok := item.(map[string]interface{}); ok {
						for itemKey, itemValue := range itemMap {
							if filePath, ok := itemValue.(string); ok && isFilePath(filePath) {
								base64File, err := file.GetFileAsBase64(a.appDataDir, filePath)
								if err == nil {
									itemMap[itemKey] = base64File
									array[i] = itemMap
								}
							}
						}
					}
				}
			}

			if nestedMap, ok := value.(map[string]interface{}); ok {
				a.ProcessRecordWithFiles(nestedMap, fetchFiles)
			}
		}
	}

	return nil
}

func isFilePath(path string) bool {
	if path == "" || strings.HasPrefix(path, "data:") {
		return false
	}

	return strings.HasPrefix(path, file.FilesDir+"/")
}

func (a *App) processDataWithExistingFiles(oldData, newData map[string]interface{}, prefix string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for key, newValue := range newData {
		switch v := newValue.(type) {
		case map[string]interface{}:
			oldNested, ok := oldData[key].(map[string]interface{})
			if !ok {
				oldNested = map[string]interface{}{}
			}

			processed, err := a.processDataWithExistingFiles(oldNested, v, prefix+"-"+key)
			if err != nil {
				return nil, err
			}
			result[key] = processed

		case []interface{}:
			if isFileArray(v) {
				processedArray, err := a.processFileArray(v, oldData[key], prefix+"-"+key)
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
			if strings.HasPrefix(v, "data:") {
				if fileMap, isFileObj := tryParseFileObject(v); isFileObj {
					fileName := fileMap["fileName"].(string)
					content := fileMap["content"].(string)
					filePath, err := a.UploadFileWithName(content, prefix+"-"+key, fileName)
					if err != nil {
						return nil, err
					}

					if oldFilePath, ok := oldData[key].(string); ok && oldFilePath != "" && !strings.HasPrefix(oldFilePath, "data:") {
						if isFilePath(oldFilePath) {
							_ = file.DeleteFile(a.appDataDir, oldFilePath)
						}
					}

					result[key] = filePath
				} else {
					filePath, err := a.UploadFileWithName(v, prefix+"-"+key, "")
					if err != nil {
						return nil, err
					}

					if oldFilePath, ok := oldData[key].(string); ok && oldFilePath != "" && !strings.HasPrefix(oldFilePath, "data:") {
						if isFilePath(oldFilePath) {
							_ = file.DeleteFile(a.appDataDir, oldFilePath)
						}
					}

					result[key] = filePath
				}
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

func isFileArray(arr []interface{}) bool {
	if len(arr) == 0 {
		return false
	}

	if obj, ok := arr[0].(map[string]interface{}); ok {
		_, hasSrc := obj["src"]
		_, hasName := obj["name"]
		return hasSrc || hasName
	}

	return false
}

func (a *App) processFileArray(arr []interface{}, oldArr interface{}, prefix string) ([]interface{}, error) {
	result := make([]interface{}, len(arr))
	oldItems := make(map[string]interface{})

	if oldArrSlice, ok := oldArr.([]interface{}); ok {
		for _, oldItem := range oldArrSlice {
			if oldObj, isObj := oldItem.(map[string]interface{}); isObj {
				if id, hasID := oldObj["id"].(string); hasID {
					oldItems[id] = oldObj
				}
			}
		}
	}

	for i, item := range arr {
		if obj, ok := item.(map[string]interface{}); ok {
			id, hasID := obj["id"].(string)

			if src, ok := obj["src"].(string); ok && strings.HasPrefix(src, "data:") {
				fileName := ""
				if name, hasName := obj["name"].(string); hasName {
					fileName = name
				}
				filePath, err := a.UploadFileWithName(src, fmt.Sprintf("%s-%d", prefix, i), fileName)

				if err != nil {
					return nil, err
				}

				if hasID {
					if oldObj, exists := oldItems[id]; exists {
						if oldItemObj, isObj := oldObj.(map[string]interface{}); isObj {
							if oldSrc, hasSrc := oldItemObj["src"].(string); hasSrc && oldSrc != "" && !strings.HasPrefix(oldSrc, "data:") {
								if isFilePath(oldSrc) {
									_ = file.DeleteFile(a.appDataDir, oldSrc)
								}
							}
						}
					}
				}

				obj["src"] = filePath
			}

			result[i] = obj
		} else {
			result[i] = item
		}
	}

	return result, nil
}

func (a *App) UploadFileChunk(chunkData string, fileName string, chunkIndex int, totalChunks int, sessionId string) (string, error) {
	return file.UploadFileInChunks(a.appDataDir, chunkData, fileName, chunkIndex, totalChunks, sessionId)
}

func (a *App) ResetAllData() error {
	return database.ResetAllData(a.appDataDir)
}

func (a *App) LoadSampleData() error {
	return database.LoadSampleDataOnce()
}

func (a *App) LoadSampleDataWithDates(startDate string, endDate string) error {
	if startDate == "" || endDate == "" {
		return fmt.Errorf("startDate and endDate cannot be empty")
	}

	return database.LoadSampleDataWithDateRange(startDate, endDate)
}

func (a *App) SaveDailyJournalWithMetrics(id string, data string, isUpdate bool) (map[string]interface{}, error) {

	var journalData map[string]interface{}
	err := json.Unmarshal([]byte(data), &journalData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse journal data: %w", err)
	}

	entryText, ok := journalData["entry"].(string)
	if !ok {
		return nil, fmt.Errorf("journal entry must contain 'entry' field")
	}

	dateStr, ok := journalData["date"].(string)
	if !ok {
		return nil, fmt.Errorf("journal entry must contain 'date' field")
	}

	journalDate, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {

		journalDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %w", err)
		}
	}

	var journalResult map[string]interface{}
	if isUpdate && id != "" {
		journalResult, err = a.UpdateRecord(id, data, false, false)
	} else {
		journalResult, err = a.AddRecord("daily_journal", data, false)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to save journal entry: %w", err)
	}

	metrics := a.extractMetrics(entryText)

	for _, metric := range metrics {

		exists, err := a.checkMetricExistsForDate(metric.ID, journalDate)
		if err != nil {
			log.Printf("Error checking metric existence: %v", err)
			continue
		}

		if !exists {

			logData := map[string]interface{}{
				"date":      journalDate.Format(time.RFC3339),
				"metric_id": metric.ID,
				"value":     metric.Value,
				"notes":     fmt.Sprintf("Logged from daily journal on %s", time.Now().Format("Jan 2, 2006 at 3:04 PM")),
			}

			logJSON, err := json.Marshal(logData)
			if err != nil {
				log.Printf("Error marshaling metric log: %v", err)
				continue
			}

			_, err = a.AddRecord("daily_logs", string(logJSON), false)
			if err != nil {
				log.Printf("Error creating daily log for metric %s: %v", metric.ID, err)
			} else {

				a.updateMetricLastOccurrence(metric.ID, journalDate)
			}
		}
	}

	todos := a.extractTodos(entryText)

	completedCount := 0
	failedCount := 0
	todoTitleCounts := make(map[string]int)

	for _, todo := range todos {
		err := a.completeTodoFromJournal(todo.ID, journalDate)
		if err != nil {
			failedCount++
		} else {
			completedCount++
			todoTitleCounts[todo.Title]++
		}
	}

	return journalResult, nil
}

type ExtractedMetric struct {
	ID    string
	Name  string
	Value string
}

type ExtractedTodo struct {
	ID    string
	Title string
}

func (a *App) extractMetrics(text string) []ExtractedMetric {
	var metrics []ExtractedMetric

	pattern := `@metric:(?:"([^"]+)"|'([^']+)'|` + "`([^`]+)`" + `|([^:\s]+)):([^\s]+)(?:\s+\(read-only\))?`
	re := regexp.MustCompile(pattern)
	matches := re.FindAllStringSubmatch(text, -1)

	allMetrics, err := database.GetDataRecords("metrics")
	if err != nil {
		return metrics
	}

	metricMap := make(map[string]string)
	for _, record := range allMetrics {
		var metricData map[string]interface{}
		err := json.Unmarshal(record.Data, &metricData)
		if err != nil {
			continue
		}

		if name, ok := metricData["name"].(string); ok {
			metricMap[name] = record.ID
		}
	}

	for _, match := range matches {
		var metricName string
		if match[1] != "" {
			metricName = match[1]
		} else if match[2] != "" {
			metricName = match[2]
		} else if match[3] != "" {
			metricName = match[3]
		} else {
			metricName = match[4]
		}
		metricValue := match[5]

		if metricID, exists := metricMap[metricName]; exists {
			metrics = append(metrics, ExtractedMetric{
				ID:    metricID,
				Name:  metricName,
				Value: metricValue,
			})
		}
	}

	return metrics
}

func (a *App) extractTodos(text string) []ExtractedTodo {
	var todos []ExtractedTodo

	pattern := `@todo:(?:"([^"]+)"|'([^']+)'|` + "`([^`]+)`" + `|([^\s:]+)):true`
	re := regexp.MustCompile(pattern)
	matches := re.FindAllStringSubmatch(text, -1)

	allTodos, err := database.GetDataRecords("todos")
	if err != nil {
		return todos
	}

	todoMap := make(map[string][]string)
	for _, record := range allTodos {
		var todoData map[string]interface{}
		err := json.Unmarshal(record.Data, &todoData)
		if err != nil {
			continue
		}

		if title, ok := todoData["title"].(string); ok {
			if isComplete, exists := todoData["is_complete"].(bool); !exists || !isComplete {
				todoMap[title] = append(todoMap[title], record.ID)
			}
		}
	}

	for _, match := range matches {
		var todoTitle string
		if match[1] != "" {
			todoTitle = match[1]
		} else if match[2] != "" {
			todoTitle = match[2]
		} else if match[3] != "" {
			todoTitle = match[3]
		} else {
			todoTitle = match[4]
		}

		if todoIDs, exists := todoMap[todoTitle]; exists {
			for _, todoID := range todoIDs {
				todos = append(todos, ExtractedTodo{
					ID:    todoID,
					Title: todoTitle,
				})
			}
		}
	}

	return todos
}

func (a *App) completeTodoFromJournal(todoID string, completedDate time.Time) error {
	// Fetch the current todo data
	todos, err := database.GetDataRecords("todos")
	if err != nil {
		return fmt.Errorf("failed to fetch todos: %w", err)
	}

	var currentTodo map[string]interface{}
	var found bool
	for _, record := range todos {
		if record.ID == todoID {
			err := json.Unmarshal(record.Data, &currentTodo)
			if err != nil {
				return fmt.Errorf("failed to unmarshal todo data: %w", err)
			}
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("todo with ID %s not found", todoID)
	}

	if isComplete, ok := currentTodo["is_complete"].(bool); ok && isComplete {
		return nil
	}

	// Update todo to completed
	currentTodo["is_complete"] = true
	currentTodo["completed_at"] = completedDate.Format(time.RFC3339)
	currentTodo["status"] = TodoStatusCompleted

	// Marshal back to JSON
	updatedData, err := json.Marshal(currentTodo)
	if err != nil {
		return fmt.Errorf("failed to marshal updated todo: %w", err)
	}

	// Update the record
	_, err = a.UpdateRecord(todoID, string(updatedData), false, false)
	if err != nil {
		return fmt.Errorf("failed to update todo record: %w", err)
	}

	return nil
}

// MigrateTodoStatusValues fixes any inconsistent todo status values to use the standard enum values
func (a *App) MigrateTodoStatusValues() error {
	todos, err := database.GetDataRecords("todos")
	if err != nil {
		return fmt.Errorf("failed to fetch todos for migration: %w", err)
	}
	
	validStatuses := map[string]bool{
		TodoStatusNotStarted: true,
		TodoStatusInProgress: true,
		TodoStatusCompleted:  true,
		TodoStatusOverdue:    true,
	}
	
	migratedCount := 0
	
	for _, record := range todos {
		var todoData map[string]interface{}
		err := json.Unmarshal(record.Data, &todoData)
		if err != nil {
			continue
		}
		
		currentStatus, exists := todoData["status"].(string)
		if !exists {
			todoData["status"] = TodoStatusNotStarted
			migratedCount++
		} else if !validStatuses[currentStatus] {
			todoData["status"] = TodoStatusNotStarted
			migratedCount++
		} else {
			continue
		}
		
		updatedData, err := json.Marshal(todoData)
		if err != nil {
			continue
		}
		
		_, err = a.UpdateRecord(record.ID, string(updatedData), false, false)
		if err != nil {
			continue
		}
	}
	
	return nil
}

func (a *App) checkMetricExistsForDate(metricID string, date time.Time) (bool, error) {
	logs, err := database.GetDataRecords("daily_logs")
	if err != nil {
		return false, err
	}

	for _, log := range logs {
		var logData map[string]interface{}
		err := json.Unmarshal(log.Data, &logData)
		if err != nil {
			continue
		}

		if logMetricID, ok := logData["metric_id"].(string); ok && logMetricID == metricID {

			if logDateStr, ok := logData["date"].(string); ok {
				logDate, err := time.Parse(time.RFC3339, logDateStr)
				if err != nil {
					continue
				}

				if logDate.Year() == date.Year() &&
					logDate.Month() == date.Month() &&
					logDate.Day() == date.Day() {
					return true, nil
				}
			}
		}
	}

	return false, nil
}

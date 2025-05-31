package database

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

func CreateDataset(dataset Dataset) error {
	err := validateDatasetFields(dataset.Fields)
	if err != nil {
		return err
	}

	now := time.Now()
	dataset.CreatedAt = now
	dataset.LastModified = now

	fieldsJSON, err := json.Marshal(dataset.Fields)
	if err != nil {
		return err
	}

	_, err = DB.Exec(
		`INSERT INTO datasets (id, name, description, type, fields, created_at, last_modified) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
		dataset.ID, dataset.Name, dataset.Description, dataset.Type, fieldsJSON, dataset.CreatedAt, dataset.LastModified,
	)
	return err
}

func GetDataset(id string) (Dataset, error) {
	var dataset Dataset
	var fieldsJSON string

	err := DB.QueryRow(
		`SELECT id, name, description, type, fields, created_at, last_modified 
         FROM datasets WHERE id = ?`, id,
	).Scan(&dataset.ID, &dataset.Name, &dataset.Description, &dataset.Type, &fieldsJSON, &dataset.CreatedAt, &dataset.LastModified)
	if err != nil {
		return Dataset{}, err
	}

	err = json.Unmarshal([]byte(fieldsJSON), &dataset.Fields)
	if err != nil {
		return Dataset{}, err
	}

	return dataset, nil
}

func UpdateDataset(dataset Dataset) error {

	err := validateDatasetFields(dataset.Fields)
	if err != nil {
		return err
	}

	dataset.LastModified = time.Now()

	fieldsJSON, err := json.Marshal(dataset.Fields)
	if err != nil {
		return err
	}

	result, err := DB.Exec(
		`UPDATE datasets SET name = ?, description = ?, type = ?, fields = ?, last_modified = ? 
         WHERE id = ?`,
		dataset.Name, dataset.Description, dataset.Type, fieldsJSON, dataset.LastModified, dataset.ID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("dataset not found")
	}

	return nil
}

func DeleteDataset(id string) error {

	recordRows, err := DB.Query("SELECT id FROM data_records WHERE dataset_id = ?", id)
	if err != nil {
		return err
	}
	defer recordRows.Close()

	for recordRows.Next() {
		var recordID string
		if err := recordRows.Scan(&recordID); err != nil {
			return err
		}

		isReferenced, err := IsRecordReferenced(recordID, id)
		if err != nil {
			return err
		}

		if isReferenced {
			return fmt.Errorf("cannot delete dataset because record %s is referenced by other records", recordID)
		}
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM data_records WHERE dataset_id = ?", id)
	if err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM datasets WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("dataset not found")
	}

	return tx.Commit()
}

func ListDatasets() ([]Dataset, error) {
	rows, err := DB.Query(
		`SELECT id, name, description, type, fields, created_at, last_modified 
         FROM datasets ORDER BY name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var datasets []Dataset
	for rows.Next() {
		var dataset Dataset
		var fieldsJSON string

		err := rows.Scan(&dataset.ID, &dataset.Name, &dataset.Description, &dataset.Type, &fieldsJSON, &dataset.CreatedAt, &dataset.LastModified)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal([]byte(fieldsJSON), &dataset.Fields)
		if err != nil {
			return nil, err
		}

		datasets = append(datasets, dataset)
	}

	return datasets, nil
}

func AddDataRecord(record DataRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}

	err := validateUniqueConstraints(record, "")
	if err != nil {
		return err
	}

	now := time.Now()
	record.CreatedAt = now
	record.LastModified = now

	_, err = DB.Exec(
		`INSERT INTO data_records (id, dataset_id, data, created_at, last_modified) 
         VALUES (?, ?, ?, ?, ?)`,
		record.ID, record.DatasetID, record.Data, record.CreatedAt, record.LastModified,
	)
	if err != nil {
		return err
	}

	return nil
}

func GetDataRecord(id string, fetchRelatedData bool) (DataRecord, error) {
	var record DataRecord

	err := DB.QueryRow(
		`SELECT id, dataset_id, data, created_at, last_modified 
         FROM data_records WHERE id = ?`, id,
	).Scan(&record.ID, &record.DatasetID, &record.Data, &record.CreatedAt, &record.LastModified)
	if err != nil {
		return DataRecord{}, err
	}

	if fetchRelatedData {
		record, err = loadRelatedData(record)
		if err != nil {
			return DataRecord{}, err
		}
	}

	return record, nil
}

func UpdateDataRecord(record DataRecord) error {
	err := validateUniqueConstraints(record, record.ID)
	if err != nil {
		return err
	}

	record.LastModified = time.Now()

	result, err := DB.Exec(
		`UPDATE data_records SET data = ?, last_modified = ? 
         WHERE id = ? AND dataset_id = ?`,
		record.Data, record.LastModified, record.ID, record.DatasetID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("record not found")
	}

	return nil
}

func loadRelatedData(record DataRecord) (DataRecord, error) {
	dataset, err := GetDataset(record.DatasetID)
	if err != nil {
		return record, err
	}

	var data map[string]interface{}
	err = json.Unmarshal(record.Data, &data)
	if err != nil {
		return record, err
	}

	for _, field := range dataset.Fields {
		if field.IsRelation && field.RelatedDataset != "" && field.RelatedField != "" {
			relIDValue, exists := data[field.Key]
			if !exists || relIDValue == nil || relIDValue == "" {
				continue
			}

			relID, ok := relIDValue.(string)
			if !ok {
				relID = fmt.Sprintf("%v", relIDValue)
			}

			if relID != "" && isValidID(relID) {
				relatedRecord, err := GetDataRecord(relID, false)
				if err == nil {
					var relatedData map[string]interface{}
					err = json.Unmarshal(relatedRecord.Data, &relatedData)
					if err == nil {
						relatedData["id"] = relatedRecord.ID
						relatedData["datasetId"] = relatedRecord.DatasetID
						relatedData["createdAt"] = relatedRecord.CreatedAt
						relatedData["lastModified"] = relatedRecord.LastModified

						relatedKey := field.Key + "_data"
						data[relatedKey] = relatedData
					}
				}
			}
		}
	}

	updatedData, err := json.Marshal(data)
	if err != nil {
		return record, err
	}
	record.Data = updatedData

	return record, nil
}

func DeleteDataRecord(id string) (json.RawMessage, error) {
	record, err := GetDataRecord(id, false)
	if err != nil {
		return nil, err
	}

	err = cascadeDeleteReferencedRecords(id, record.DatasetID)
	if err != nil {
		return nil, err
	}

	isReferenced, err := IsRecordReferenced(id, record.DatasetID)
	if err != nil {
		return nil, err
	}

	if isReferenced {
		return nil, errors.New("cannot delete record because it is referenced by other records")
	}

	recordData := record.Data

	result, err := DB.Exec("DELETE FROM data_records WHERE id = ?", id)
	if err != nil {
		return nil, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, errors.New("record not found")
	}

	return recordData, nil
}

func GetDataRecords(datasetID string) ([]DataRecord, error) {
	rows, err := DB.Query(
		`SELECT id, dataset_id, data, created_at, last_modified 
         FROM data_records WHERE dataset_id = ? ORDER BY created_at DESC`,
		datasetID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []DataRecord
	for rows.Next() {
		var record DataRecord

		err := rows.Scan(&record.ID, &record.DatasetID, &record.Data, &record.CreatedAt, &record.LastModified)
		if err != nil {
			return nil, err
		}

		records = append(records, record)
	}

	return records, nil
}

func ImportRecords(records []DataRecord) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(
		`INSERT INTO data_records (id, dataset_id, data, created_at, last_modified) 
         VALUES (?, ?, ?, ?, ?)`,
	)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	for i := range records {
		if records[i].ID == "" {
			records[i].ID = uuid.New().String()
		}

		records[i].CreatedAt = now
		records[i].LastModified = now

		_, err = stmt.Exec(
			records[i].ID, records[i].DatasetID, records[i].Data,
			records[i].CreatedAt, records[i].LastModified,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func GetDataRecordsWithRelations(datasetID string, relations map[string]string) ([]map[string]interface{}, error) {
	records, err := GetDataRecords(datasetID)
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return []map[string]interface{}{}, nil
	}

	dataset, err := GetDataset(datasetID)
	if err != nil {
		return nil, err
	}

	var relationFields []FieldDefinition
	for _, field := range dataset.Fields {
		if field.IsRelation && field.RelatedDataset != "" && field.RelatedField != "" {
			relationFields = append(relationFields, field)
		}
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

		for _, field := range relationFields {
			_, requested := relations[field.Key]
			if len(relations) == 0 || requested {
				relIDValue, exists := data[field.Key]
				if !exists || relIDValue == nil || relIDValue == "" {
					continue
				}

				relID, ok := relIDValue.(string)
				if !ok {
					relID = fmt.Sprintf("%v", relIDValue)
				}

				if relID != "" && isValidID(relID) {
					relatedRecord, err := GetDataRecord(relID, true)
					if err != nil {
						fmt.Printf("Error fetching related record for field %s with ID %s: %v\n",
							field.Key, relID, err)
						continue
					}

					var relatedData map[string]interface{}
					err = json.Unmarshal(relatedRecord.Data, &relatedData)
					if err != nil {
						continue
					}

					relatedData["id"] = relatedRecord.ID
					relatedData["datasetId"] = relatedRecord.DatasetID
					relatedData["createdAt"] = relatedRecord.CreatedAt
					relatedData["lastModified"] = relatedRecord.LastModified

					relatedKey := field.Key + "_data"
					data[relatedKey] = relatedData
				}
			}
		}

		result[i] = data
	}

	return result, nil
}

func isValidID(id string) bool {
	return len(id) > 8 && !strings.Contains(id, "/")
}

func IsRecordReferenced(id string, datasetID string) (bool, error) {

	_, err := GetDataset(datasetID)
	if err != nil {
		return false, fmt.Errorf("failed to get dataset: %w", err)
	}

	datasets, err := ListDatasets()
	if err != nil {
		return false, fmt.Errorf("failed to list datasets: %w", err)
	}

	for _, otherDataset := range datasets {
		for _, field := range otherDataset.Fields {

			if field.IsRelation && field.RelatedDataset == datasetID && field.PreventDeleteIfReferenced {

				query := fmt.Sprintf(
					`SELECT COUNT(*) FROM data_records 
                     WHERE dataset_id = ? AND json_extract(data, '$.%s') = ?`,
					field.Key)

				var count int
				err := DB.QueryRow(query, otherDataset.ID, id).Scan(&count)
				if err != nil {
					return false, fmt.Errorf("error checking references: %w", err)
				}

				if count > 0 {
					return true, nil
				}
			}
		}
	}

	return false, nil
}

func validateDatasetFields(fields []FieldDefinition) error {
	for _, field := range fields {
		if field.PreventDeleteIfReferenced && field.CascadeDeleteIfReferenced {
			return fmt.Errorf("field '%s' cannot have both PreventDeleteIfReferenced and CascadeDeleteIfReferenced set to true", field.Key)
		}
	}
	return nil
}

func validateUniqueConstraints(record DataRecord, excludeRecordID string) error {
	dataset, err := GetDataset(record.DatasetID)
	if err != nil {
		return fmt.Errorf("failed to get dataset: %w", err)
	}

	var data map[string]interface{}
	err = json.Unmarshal(record.Data, &data)
	if err != nil {
		return fmt.Errorf("failed to parse record data: %w", err)
	}

	for _, field := range dataset.Fields {
		if !field.IsUnique {
			continue
		}

		fieldValue, exists := data[field.Key]
		if !exists || fieldValue == nil {
			continue
		}

		var fieldValueStr string
		switch v := fieldValue.(type) {
		case string:
			fieldValueStr = v
		case float64:
			fieldValueStr = fmt.Sprintf("%.0f", v)
		case bool:
			fieldValueStr = fmt.Sprintf("%t", v)
		default:
			fieldValueStr = fmt.Sprintf("%v", v)
		}

		if fieldValueStr == "" {
			continue
		}

		query := fmt.Sprintf(
			`SELECT id FROM data_records 
			 WHERE dataset_id = ? AND json_extract(data, '$.%s') = ?`,
			field.Key)

		var existingRecordID string
		err := DB.QueryRow(query, record.DatasetID, fieldValueStr).Scan(&existingRecordID)

		if err == nil && existingRecordID != excludeRecordID {
			return fmt.Errorf("field '%s' must be unique. Value '%s' already exists in another record", field.DisplayName, fieldValueStr)
		}
	}

	return nil
}

func cascadeDeleteReferencedRecords(id string, datasetID string) error {
	_, err := GetDataset(datasetID)
	if err != nil {
		return fmt.Errorf("failed to get dataset: %w", err)
	}

	datasets, err := ListDatasets()
	if err != nil {
		return fmt.Errorf("failed to list datasets: %w", err)
	}

	var recordsToDelete []string

	for _, otherDataset := range datasets {
		for _, field := range otherDataset.Fields {
			if field.IsRelation && field.RelatedDataset == datasetID && field.CascadeDeleteIfReferenced {
				query := fmt.Sprintf(
					`SELECT id FROM data_records 
					 WHERE dataset_id = ? AND json_extract(data, '$.%s') = ?`,
					field.Key)

				rows, err := DB.Query(query, otherDataset.ID, id)
				if err != nil {
					return fmt.Errorf("error finding records to cascade delete: %w", err)
				}
				defer rows.Close()

				for rows.Next() {
					var recordID string
					if err := rows.Scan(&recordID); err != nil {
						return fmt.Errorf("error scanning record ID: %w", err)
					}
					recordsToDelete = append(recordsToDelete, recordID)
				}
			}
		}
	}

	for _, recordID := range recordsToDelete {
		_, err := DeleteDataRecord(recordID)
		if err != nil {
			return fmt.Errorf("error cascade deleting record %s: %w", recordID, err)
		}
	}

	return nil
}

func ResetAllData(appDataDir string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM data_records")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM datasets")
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	err = clearAllFiles(appDataDir)
	if err != nil {
		return err
	}

	return SyncDatasets()
}

func clearAllFiles(appDataDir string) error {
	imagesDir := filepath.Join(appDataDir, "images")
	filesDir := filepath.Join(appDataDir, "files")

	if err := os.RemoveAll(imagesDir); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to clear images directory: %w", err)
	}

	if err := os.RemoveAll(filesDir); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to clear files directory: %w", err)
	}

	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		return fmt.Errorf("failed to recreate images directory: %w", err)
	}

	if err := os.MkdirAll(filesDir, 0755); err != nil {
		return fmt.Errorf("failed to recreate files directory: %w", err)
	}

	return nil
}

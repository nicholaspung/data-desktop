// backend/database/repository.go
package database

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// CreateDataset adds a new dataset to the database
func CreateDataset(dataset Dataset) error {
	// Set created and modified timestamps
	now := time.Now()
	dataset.CreatedAt = now
	dataset.LastModified = now

	// Convert fields to JSON
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

// GetDataset retrieves a dataset by its ID
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

	// Parse fields JSON
	err = json.Unmarshal([]byte(fieldsJSON), &dataset.Fields)
	if err != nil {
		return Dataset{}, err
	}

	return dataset, nil
}

// UpdateDataset updates an existing dataset
func UpdateDataset(dataset Dataset) error {
	// Update last modified timestamp
	dataset.LastModified = time.Now()

	// Convert fields to JSON
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

// DeleteDataset removes a dataset and all its records
func DeleteDataset(id string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete all records for this dataset
	_, err = tx.Exec("DELETE FROM data_records WHERE dataset_id = ?", id)
	if err != nil {
		return err
	}

	// Delete the dataset
	result, err := tx.Exec("DELETE FROM datasets WHERE id = ?", id)
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

	return tx.Commit()
}

// ListDatasets returns all datasets
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

		// Parse fields JSON
		err = json.Unmarshal([]byte(fieldsJSON), &dataset.Fields)
		if err != nil {
			return nil, err
		}

		datasets = append(datasets, dataset)
	}

	return datasets, nil
}

// AddDataRecord adds a new data record
func AddDataRecord(record DataRecord) error {
	// Generate UUID if not provided
	if record.ID == "" {
		record.ID = uuid.New().String()
	}

	// Set timestamps
	now := time.Now()
	record.CreatedAt = now
	record.LastModified = now

	// Insert record
	_, err := DB.Exec(
		`INSERT INTO data_records (id, dataset_id, data, created_at, last_modified) 
         VALUES (?, ?, ?, ?, ?)`,
		record.ID, record.DatasetID, record.Data, record.CreatedAt, record.LastModified,
	)
	return err
}

// GetDataRecord retrieves a single data record by its ID
func GetDataRecord(id string) (DataRecord, error) {
	var record DataRecord

	err := DB.QueryRow(
		`SELECT id, dataset_id, data, created_at, last_modified 
         FROM data_records WHERE id = ?`, id,
	).Scan(&record.ID, &record.DatasetID, &record.Data, &record.CreatedAt, &record.LastModified)
	if err != nil {
		return DataRecord{}, err
	}

	return record, nil
}

// UpdateDataRecord updates an existing data record
func UpdateDataRecord(record DataRecord) error {
	// Update last modified timestamp
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

// DeleteDataRecord removes a data record
func DeleteDataRecord(id string) error {
	result, err := DB.Exec("DELETE FROM data_records WHERE id = ?", id)
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

// GetDataRecords retrieves all records for a specific dataset
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

// ImportRecords imports multiple data records in a transaction
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
		// Generate UUID if not provided
		if records[i].ID == "" {
			records[i].ID = uuid.New().String()
		}

		// Set timestamps
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

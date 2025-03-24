// backend/database/dataset_sync.go
package database

import (
	"fmt"
	"time"
)

// SyncDatasets ensures all default datasets exist in the database
// and their fields are up to date
func SyncDatasets() error {
	fmt.Println("Syncing datasets with the database...")

	// Sync DEXA dataset
	err := CreateOrUpdateDataset(
		DatasetIDDEXA,
		"DEXA Scans",
		"Body composition measurements from DEXA scans",
		DatasetTypeDEXA,
		GetDEXAFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync DEXA dataset: %w", err)
	}

	// Sync Bloodwork dataset
	err = CreateOrUpdateDataset(
		DatasetIDBloodwork,
		"Bloodwork",
		"Blood test results and markers",
		DatasetTypeBloodwork,
		GetBloodworkFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Bloodwork dataset: %w", err)
	}

	// Sync Paycheck dataset
	err = CreateOrUpdateDataset(
		DatasetIDPaycheck,
		"Paychecks",
		"Paycheck and income information",
		DatasetTypePaycheck,
		GetPaycheckFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Paycheck dataset: %w", err)
	}

	// Sync Habit dataset
	err = CreateOrUpdateDataset(
		DatasetIDHabit,
		"Habits",
		"Track daily habits and routines",
		DatasetTypeHabit,
		GetHabitFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Habit dataset: %w", err)
	}

	fmt.Println("Dataset sync completed successfully")
	return nil
}

// CreateOrUpdateDataset creates a dataset if it doesn't exist or updates its fields if it does
func CreateOrUpdateDataset(id string, name string, description string, datasetType DatasetType, fields []FieldDefinition) error {
	// Try to get existing dataset
	dataset, err := GetDataset(id)

	// If dataset doesn't exist, create it
	if err != nil {
		// Only create if the error is "no rows in result set"
		if err.Error() == "sql: no rows in result set" {
			newDataset := Dataset{
				ID:           id,
				Name:         name,
				Description:  description,
				Type:         datasetType,
				Fields:       fields,
				CreatedAt:    time.Now(),
				LastModified: time.Now(),
			}

			err = CreateDataset(newDataset)
			if err != nil {
				return fmt.Errorf("error creating dataset %s: %w", id, err)
			}
			fmt.Printf("Created dataset: %s\n", id)
			return nil
		}

		// For any other error, return it
		return fmt.Errorf("error getting dataset %s: %w", id, err)
	}

	// Dataset exists, check if fields need updating
	if !FieldsEqual(dataset.Fields, fields) {
		// Update dataset fields
		dataset.Fields = fields
		dataset.LastModified = time.Now()

		err = UpdateDataset(dataset)
		if err != nil {
			return fmt.Errorf("error updating dataset %s: %w", id, err)
		}
		fmt.Printf("Updated fields for dataset: %s\n", id)
	}

	return nil
}

// FieldsEqual compares two lists of field definitions to see if they're the same
func FieldsEqual(a, b []FieldDefinition) bool {
	if len(a) != len(b) {
		return false
	}

	// Create maps for faster lookup
	aMap := make(map[string]FieldDefinition)
	for _, field := range a {
		aMap[field.Key] = field
	}

	// Check if all fields in b match those in a
	for _, fieldB := range b {
		fieldA, exists := aMap[fieldB.Key]
		if !exists {
			return false
		}

		// Compare field properties
		if fieldA.Type != fieldB.Type ||
			fieldA.DisplayName != fieldB.DisplayName ||
			fieldA.Description != fieldB.Description ||
			fieldA.Unit != fieldB.Unit ||
			fieldA.IsSearchable != fieldB.IsSearchable {
			return false
		}
	}

	return true
}

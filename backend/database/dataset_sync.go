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

	// Sync Blood Markers dataset
	err = CreateOrUpdateDataset(
		DatasetIDBloodMarker,
		"Blood Markers",
		"Definitions of blood markers with reference ranges",
		DatasetTypeBloodwork, // Using the same type as bloodwork
		GetBloodMarkerFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Blood Markers dataset: %w", err)
	}

	// Sync Blood Results dataset
	err = CreateOrUpdateDataset(
		DatasetIDBloodResult,
		"Blood Results",
		"Individual blood marker results for tests",
		DatasetTypeBloodwork, // Using the same type as bloodwork
		GetBloodResultFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Blood Results dataset: %w", err)
	}

	// Sync Experiments dataset
	err = CreateOrUpdateDataset(
		DatasetIDExperiment,
		"Experiments",
		"Track experiments with goals and metrics",
		DatasetTypeExperiment,
		GetExperimentFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Experiments dataset: %w", err)
	}

	// Sync Metrics dataset
	err = CreateOrUpdateDataset(
		DatasetIDMetric,
		"Metrics",
		"Define metrics to track",
		DatasetTypeMetric,
		GetMetricFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Metrics dataset: %w", err)
	}

	// Sync Daily Logs dataset
	err = CreateOrUpdateDataset(
		DatasetIDDailyLog,
		"Daily Logs",
		"Daily tracking of metrics",
		DatasetTypeDailyLog,
		GetDailyLogFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Daily Logs dataset: %w", err)
	}

	// Sync Metric Categories dataset
	err = CreateOrUpdateDataset(
		DatasetIDMetricCategory,
		"Metric Categories",
		"Categories for metrics",
		DatasetTypeMetric, // Using the same type as metrics
		GetMetricCategoryFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Metric Categories dataset: %w", err)
	}

	// Sync Experiment Metrics dataset
	err = CreateOrUpdateDataset(
		DatasetIDExperimentMetric,
		"Experiment Metrics",
		"Metrics and targets for experiments",
		DatasetTypeExperiment, // Using the same type as experiments
		GetExperimentMetricFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Experiment Metrics dataset: %w", err)
	}

	err = CreateOrUpdateDataset(
		DatasetIDGratitudeJournal,
		"Gratitude Journal",
		"Record things you are grateful for",
		DatasetTypeJournaling,
		GetGratitudeJournalFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Gratitude Journal dataset: %w", err)
	}

	err = CreateOrUpdateDataset(
		DatasetIDAffirmation,
		"Affirmation",
		"What affirmation do you want to repeat today?",
		DatasetTypeJournaling,
		GetAffirmationFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Affirmation dataset: %w", err)
	}

	err = CreateOrUpdateDataset(
		DatasetIDCreativityJournal,
		"Creativity Journal",
		"Creativity journal for daily thoughts",
		DatasetTypeJournaling,
		GetCreativityJournalFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Affirmation dataset: %w", err)
	}

	err = CreateOrUpdateDataset(
		DatasetIDQuestionJournal,
		"Question Journal",
		"Journal for daily questions",
		DatasetTypeJournaling,
		GetQuestionJournalFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Affirmation dataset: %w", err)
	}

	err = CreateOrUpdateDataset(
		DatasetIDTimeEntries,
		"Time Entries",
		"Track time spent on various activities",
		DatasetTypeTimeTracking,
		GetTimeEntriesFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Time Entries dataset: %w", err)
	}

	// Sync Time Categories dataset
	err = CreateOrUpdateDataset(
		DatasetIDTimeCategories,
		"Time Categories",
		"Categories for time tracking activities",
		DatasetTypeTimeTracking,
		GetTimeCategoriesFields(),
	)
	if err != nil {
		return fmt.Errorf("failed to sync Time Categories dataset: %w", err)
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
			fieldA.IsSearchable != fieldB.IsSearchable ||
			fieldA.IsRelation != fieldB.IsRelation ||
			fieldA.RelatedDataset != fieldB.RelatedDataset ||
			fieldA.RelatedField != fieldB.RelatedField {
			return false
		}
	}

	return true
}

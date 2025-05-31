package database

import (
	"fmt"
	"time"
)

func SyncDatasets() error {
	fmt.Println("Syncing datasets from unified definitions...")
	configs := GetAllDatasetDefinitions()

	for _, config := range configs {
		err := CreateOrUpdateDataset(config.ID, config.Name, config.Description, config.Type, config.Fields)
		if err != nil {
			return fmt.Errorf("failed to sync %s dataset: %w", config.ID, err)
		}
	}

	fmt.Println("Dataset sync completed successfully")
	return nil
}

func CreateOrUpdateDataset(id string, name string, description string, datasetType DatasetType, fields []FieldDefinition) error {
	dataset, err := GetDataset(id)

	if err != nil {
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

		return fmt.Errorf("error getting dataset %s: %w", id, err)
	}

	dataset.Fields = fields
	dataset.LastModified = time.Now()

	err = UpdateDataset(dataset)
	if err != nil {
		return fmt.Errorf("error updating dataset %s: %w", id, err)
	}
	fmt.Printf("Updated fields for dataset: %s\n", id)

	return nil
}

func FieldsEqual(a, b []FieldDefinition) bool {
	if len(a) != len(b) {
		return false
	}

	aMap := make(map[string]FieldDefinition)
	for _, field := range a {
		aMap[field.Key] = field
	}

	for _, fieldB := range b {
		fieldA, exists := aMap[fieldB.Key]
		if !exists {
			return false
		}

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

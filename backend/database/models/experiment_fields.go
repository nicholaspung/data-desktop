// backend/database/models/experiment_fields.go
package models

import (
	"myproject/backend/database"
)

// GetExperimentFields returns the field definitions for the Experiment dataset
func GetExperimentFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the experiment",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "Description of the experiment",
		},
		{
			Key:          "start_date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Start Date",
			Description:  "When the experiment starts",
			IsSearchable: true,
		},
		{
			Key:         "end_date",
			Type:        database.FieldTypeDate,
			DisplayName: "End Date",
			Description: "When the experiment ends (optional)",
		},
		{
			Key:         "goal",
			Type:        database.FieldTypeText,
			DisplayName: "Goal",
			Description: "The goal of this experiment",
		},
		{
			Key:         "status",
			Type:        database.FieldTypeText,
			DisplayName: "Status",
			Description: "Status of the experiment",
		},
	}
}

// GetMetricFields returns the field definitions for the Metric dataset
func GetMetricFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the metric",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "Description of the metric",
		},
		{
			Key:         "type",
			Type:        database.FieldTypeText,
			DisplayName: "Type",
			Description: "Type of metric (number, boolean, time, percentage)",
		},
		{
			Key:         "unit",
			Type:        database.FieldTypeText,
			DisplayName: "Unit",
			Description: "Unit of measurement (if applicable)",
		},
		{
			Key:         "default_value",
			Type:        database.FieldTypeText, // JSON encoded default value
			DisplayName: "Default Value",
			Description: "Default value for this metric",
		},
		{
			Key:            "category_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Category",
			Description:    "Category of this metric",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "metric_categories",
			RelatedField:   "id",
		},
	}
}

// GetDailyLogFields returns the field definitions for the DailyLog dataset
func GetDailyLogFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the log",
			IsSearchable: true,
		},
		{
			Key:            "metric_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Metric",
			Description:    "The metric being tracked",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
		},
		{
			Key:            "experiment_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Experiment",
			Description:    "The experiment this log belongs to (if any)",
			IsRelation:     true,
			RelatedDataset: "experiments",
			RelatedField:   "id",
		},
		{
			Key:         "value",
			Type:        database.FieldTypeText, // JSON encoded value
			DisplayName: "Value",
			Description: "The value recorded for this metric",
		},
		{
			Key:         "notes",
			Type:        database.FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes",
		},
	}
}

// GetMetricCategoryFields returns the field definitions for the MetricCategory dataset
func GetMetricCategoryFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the category",
			IsSearchable: true,
		},
		{
			Key:         "color",
			Type:        database.FieldTypeText,
			DisplayName: "Color",
			Description: "Color for this category",
		},
	}
}

// GetExperimentMetricFields returns the field definitions for the ExperimentMetric dataset
func GetExperimentMetricFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "experiment_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Experiment",
			Description:    "The experiment this metric belongs to",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "experiments",
			RelatedField:   "id",
		},
		{
			Key:            "metric_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Metric",
			Description:    "The metric to track in this experiment",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
		},
		{
			Key:         "target",
			Type:        database.FieldTypeText,
			DisplayName: "Target",
			Description: "Target value for this metric",
		},
		{
			Key:         "target_type",
			Type:        database.FieldTypeText,
			DisplayName: "Target Type",
			Description: "How to evaluate the target (atleast, atmost, exactly, boolean)",
		},
		{
			Key:         "importance",
			Type:        database.FieldTypeNumber,
			DisplayName: "Importance",
			Description: "How important this metric is to the experiment (1-10 scale)",
		},
	}
}

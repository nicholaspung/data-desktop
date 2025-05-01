// backend/database/models/time_planner_config_fields.go
package models

import (
	"myproject/backend/database"
)

// GetTimePlannerConfigFields returns the field definitions for the Time Planner Configs
func GetTimePlannerConfigFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the time planner configuration",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "Description of the time planner configuration",
			IsOptional:  true,
		},
		{
			Key:         "blocks",
			Type:        database.FieldTypeText, // JSON array of time blocks
			DisplayName: "Time Blocks",
			Description: "Time blocks for this configuration",
		},
	}
}

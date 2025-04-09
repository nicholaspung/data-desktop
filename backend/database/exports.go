// backend/database/exports.go
package database

// This file defines the function types for dataset field definitions,
// which will be populated by the models package.

// Function type for getting field definitions
type FieldDefinitionFunc func() []FieldDefinition

// These variables will be populated by the models package
var (
	// Existing fields
	GetDEXAFields        FieldDefinitionFunc
	GetBloodworkFields   FieldDefinitionFunc
	GetPaycheckFields    FieldDefinitionFunc
	GetHabitFields       FieldDefinitionFunc
	GetBloodMarkerFields FieldDefinitionFunc
	GetBloodResultFields FieldDefinitionFunc

	// New experiment-related fields
	GetExperimentFields       FieldDefinitionFunc
	GetMetricFields           FieldDefinitionFunc
	GetDailyLogFields         FieldDefinitionFunc
	GetMetricCategoryFields   FieldDefinitionFunc
	GetExperimentMetricFields FieldDefinitionFunc
)

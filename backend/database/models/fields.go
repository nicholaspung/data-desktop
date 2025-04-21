// backend/database/models/fields.go
package models

import (
	"myproject/backend/database"
)

// This file exports the field definition functions from the models package
// to be used by the database package for dataset synchronization.

// These functions are mapped to the appropriate database package variables
// to make the field definitions accessible outside this package.

func init() {
	database.GetDEXAFields = GetDEXAFields
	database.GetBloodworkFields = GetBloodworkFields
	database.GetBloodMarkerFields = GetBloodMarkerFields
	database.GetBloodResultFields = GetBloodResultFields
	database.GetExperimentFields = GetExperimentFields
	database.GetMetricFields = GetMetricFields
	database.GetDailyLogFields = GetDailyLogFields
	database.GetMetricCategoryFields = GetMetricCategoryFields
	database.GetExperimentMetricFields = GetExperimentMetricFields
	database.GetGratitudeJournalFields = GetGratitudeJournalFields
	database.GetAffirmationFields = GetAffirmationFields
	database.GetCreativityJournalFields = GetCreativityJournalFields
	database.GetQuestionJournalFields = GetQuestionJournalFields
}

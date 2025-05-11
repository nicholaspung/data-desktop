// backend/database/constants.go
package database

// Dataset ID constants - ensure these match with frontend expectations
const (
	DatasetIDDEXA              = "dexa"
	DatasetIDBloodwork         = "bloodwork"
	DatasetIDBloodMarker       = "blood_markers"
	DatasetIDBloodResult       = "blood_results"
	DatasetIDExperiment        = "experiments"
	DatasetIDMetric            = "metrics"
	DatasetIDDailyLog          = "daily_logs"
	DatasetIDMetricCategory    = "metric_categories"
	DatasetIDExperimentMetric  = "experiment_metrics"
	DatasetIDGratitudeJournal  = "gratitude_journal"
	DatasetIDAffirmation       = "affirmation"
	DatasetIDCreativityJournal = "creativity_journal"
	DatasetIDQuestionJournal   = "question_journal"
	DatasetIDTimeEntries       = "time_entries"
	DatasetIDTimeCategories    = "time_categories"
	DatasetIDTimePlannerConfig = "time_planner_configs"
	DatasetIDTodos             = "todos"

	// People CRM datasets
	DatasetIDPeople              = "people"
	DatasetIDMeetings            = "meetings"
	DatasetIDPersonAttributes    = "person_attributes"
	DatasetIDPersonNotes         = "person_notes"
	DatasetIDPersonChats         = "person_chats"
	DatasetIDBirthdayReminders   = "birthday_reminders"
	DatasetIDPersonRelationships = "person_relationships"
)

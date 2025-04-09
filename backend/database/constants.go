// backend/database/constants.go
package database

// Dataset ID constants - ensure these match with frontend expectations
const (
	// Existing datasets
	DatasetIDDEXA        = "dexa"
	DatasetIDBloodwork   = "bloodwork"
	DatasetIDPaycheck    = "paycheck"
	DatasetIDHabit       = "habit"
	DatasetIDBloodMarker = "blood_markers"
	DatasetIDBloodResult = "blood_results"

	// New experiment-related datasets
	DatasetIDExperiment       = "experiments"
	DatasetIDMetric           = "metrics"
	DatasetIDDailyLog         = "daily_logs"
	DatasetIDMetricCategory   = "metric_categories"
	DatasetIDExperimentMetric = "experiment_metrics"
)

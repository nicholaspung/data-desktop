package database

func GetAllDatasetDefinitions() []DatasetConfig {
	return []DatasetConfig{
		{
			ID:          DatasetIDDEXA,
			Name:        "DEXA Scans",
			Description: "DEXA scan results for body composition and bone density tracking",
			Type:        DatasetTypeDEXA,
			Fields:      GetDEXAFields(),
		},
		{
			ID:          DatasetIDBloodwork,
			Name:        "Bloodwork Tests",
			Description: "Blood test sessions and lab information",
			Type:        DatasetTypeBloodwork,
			Fields:      GetBloodworkFields(),
		},
		{
			ID:          DatasetIDBloodMarker,
			Name:        "Blood Markers",
			Description: "Blood markers with reference ranges and optimal values",
			Type:        DatasetTypeBloodwork,
			Fields:      GetBloodMarkerFields(),
		},
		{
			ID:          DatasetIDBloodResult,
			Name:        "Blood Results",
			Description: "Individual blood marker results from lab tests",
			Type:        DatasetTypeBloodwork,
			Fields:      GetBloodResultFields(),
		},
		{
			ID:          DatasetIDExperiment,
			Name:        "Experiments",
			Description: "Personal experiments for tracking changes and improvements",
			Type:        DatasetTypeExperiment,
			Fields:      GetExperimentFields(),
		},
		{
			ID:          DatasetIDMetric,
			Name:        "Metrics",
			Description: "Daily tracking metrics for health, productivity, and habits",
			Type:        DatasetTypeExperiment,
			Fields:      GetMetricFields(),
		},
		{
			ID:          DatasetIDDailyLog,
			Name:        "Daily Logs",
			Description: "Daily metric entries and tracking data",
			Type:        DatasetTypeExperiment,
			Fields:      GetDailyLogFields(),
		},
		{
			ID:          DatasetIDMetricCategory,
			Name:        "Metric Categories",
			Description: "Categories for organizing metrics",
			Type:        DatasetTypeExperiment,
			Fields:      GetMetricCategoryFields(),
		},
		{
			ID:          DatasetIDExperimentMetric,
			Name:        "Experiment Metrics",
			Description: "Links between experiments and the metrics they track",
			Type:        DatasetTypeExperiment,
			Fields:      GetExperimentMetricFields(),
		},
		{
			ID:          DatasetIDGratitudeJournal,
			Name:        "Gratitude Journal",
			Description: "Daily gratitude entries for mindfulness and reflection",
			Type:        DatasetTypeJournaling,
			Fields:      GetGratitudeJournalFields(),
		},
		{
			ID:          DatasetIDAffirmation,
			Name:        "Affirmations",
			Description: "Daily affirmations for personal development",
			Type:        DatasetTypeJournaling,
			Fields:      GetAffirmationFields(),
		},
		{
			ID:          DatasetIDCreativityJournal,
			Name:        "Creativity Journal",
			Description: "Creative writing and ideation entries",
			Type:        DatasetTypeJournaling,
			Fields:      GetCreativityJournalFields(),
		},
		{
			ID:          DatasetIDQuestionJournal,
			Name:        "Question Journal",
			Description: "Daily reflective questions and responses",
			Type:        DatasetTypeJournaling,
			Fields:      GetQuestionJournalFields(),
		},
		{
			ID:          DatasetIDTimeEntries,
			Name:        "Time Entries",
			Description: "Time tracking entries for productivity analysis",
			Type:        DatasetTypeTimeTracking,
			Fields:      GetTimeEntriesFields(),
		},
		{
			ID:          DatasetIDTimeCategories,
			Name:        "Time Categories",
			Description: "Categories for organizing time tracking activities",
			Type:        DatasetTypeTimeTracking,
			Fields:      GetTimeCategoriesFields(),
		},
		{
			ID:          DatasetIDTimePlannerConfig,
			Name:        "Time Planner Configs",
			Description: "Time planner configuration templates",
			Type:        DatasetTypeTimeTracking,
			Fields:      GetTimePlannerConfigFields(),
		},
		{
			ID:          DatasetIDTodos,
			Name:        "Todos",
			Description: "Task and todo management with deadlines and priorities",
			Type:        DatasetTypeTodo,
			Fields:      GetTodoFields(),
		},
		{
			ID:          DatasetIDPeople,
			Name:        "People",
			Description: "Personal contacts and relationship management",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetPeopleFields(),
		},
		{
			ID:          DatasetIDMeetings,
			Name:        "Meetings",
			Description: "Meeting records with contacts and follow-ups",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetMeetingsFields(),
		},
		{
			ID:          DatasetIDPersonAttributes,
			Name:        "Person Attributes",
			Description: "Personal attributes and characteristics of contacts",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetPersonAttributesFields(),
		},
		{
			ID:          DatasetIDPersonNotes,
			Name:        "Person Notes",
			Description: "Notes and observations about contacts",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetPersonNotesFields(),
		},
		{
			ID:          DatasetIDBirthdayReminders,
			Name:        "Birthday Reminders",
			Description: "Reminders for contact birthdays and special dates",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetBirthdayRemindersFields(),
		},
		{
			ID:          DatasetIDPersonRelationships,
			Name:        "Person Relationships",
			Description: "Relationships between contacts in your network",
			Type:        DatasetTypePeopleCRM,
			Fields:      GetPersonRelationshipsFields(),
		},
		{
			ID:          DatasetIDBodyMeasurements,
			Name:        "Body Measurements",
			Description: "Body measurements tracking for physical progress monitoring",
			Type:        DatasetTypeMetric,
			Fields:      getBodyMeasurementsFieldsInline(),
		},
		{
			ID:          DatasetIDFinancialLogs,
			Name:        "Financial Logs",
			Description: "Financial transaction logs for expense and income tracking",
			Type:        DatasetTypeFinancial,
			Fields:      getFinancialLogsFieldsInline(),
		},
		{
			ID:          DatasetIDFinancialBalances,
			Name:        "Financial Balances",
			Description: "Account balances tracking for financial monitoring",
			Type:        DatasetTypeFinancial,
			Fields:      getFinancialBalancesFieldsInline(),
		},
		{
			ID:          DatasetIDPaycheckInfo,
			Name:        "Paycheck Information",
			Description: "Paycheck details including deductions and benefits",
			Type:        DatasetTypeFinancial,
			Fields:      getPaycheckInfoFieldsInline(),
		},
		{
			ID:          DatasetIDFinancialFiles,
			Name:        "Financial Files",
			Description: "Financial document storage and management",
			Type:        DatasetTypeFinancial,
			Fields:      getFinancialFilesFieldsInline(),
		},
	}
}

func getBodyMeasurementsFieldsInline() []FieldDefinition {
	return []FieldDefinition{
		{Key: "date", Type: FieldTypeDate, DisplayName: "Date", IsSearchable: true},
		{Key: "time", Type: FieldTypeText, DisplayName: "Time", IsOptional: true},
		{Key: "measurement", Type: FieldTypeText, DisplayName: "Measurement", IsSearchable: true},
		{Key: "value", Type: FieldTypeNumber, DisplayName: "Value"},
		{Key: "unit", Type: FieldTypeText, DisplayName: "Unit", IsSearchable: true},
		{Key: "private", Type: FieldTypeBoolean, DisplayName: "Private", IsOptional: true},
	}
}

func getFinancialLogsFieldsInline() []FieldDefinition {
	return []FieldDefinition{
		{Key: "date", Type: FieldTypeDate, DisplayName: "Date", IsSearchable: true},
		{Key: "amount", Type: FieldTypeNumber, DisplayName: "Amount", Unit: "$"},
		{Key: "description", Type: FieldTypeText, DisplayName: "Description", IsSearchable: true},
		{Key: "category", Type: FieldTypeText, DisplayName: "Category", IsSearchable: true},
		{Key: "tags", Type: FieldTypeText, DisplayName: "Tags", IsSearchable: true, IsOptional: true},
	}
}

func getFinancialBalancesFieldsInline() []FieldDefinition {
	return []FieldDefinition{
		{Key: "date", Type: FieldTypeDate, DisplayName: "Date", IsSearchable: true},
		{Key: "amount", Type: FieldTypeNumber, DisplayName: "Amount", Unit: "$"},
		{Key: "account_name", Type: FieldTypeText, DisplayName: "Account Name", IsSearchable: true},
		{Key: "account_type", Type: FieldTypeText, DisplayName: "Account Type", IsSearchable: true},
		{Key: "account_owner", Type: FieldTypeText, DisplayName: "Account Owner", IsSearchable: true},
	}
}

func getPaycheckInfoFieldsInline() []FieldDefinition {
	return []FieldDefinition{
		{Key: "date", Type: FieldTypeDate, DisplayName: "Date", IsSearchable: true},
		{Key: "amount", Type: FieldTypeNumber, DisplayName: "Amount", Unit: "$"},
		{Key: "category", Type: FieldTypeText, DisplayName: "Category", IsSearchable: true},
		{Key: "deduction_type", Type: FieldTypeText, DisplayName: "Deduction Type", IsSearchable: true},
	}
}

func getFinancialFilesFieldsInline() []FieldDefinition {
	return []FieldDefinition{
		{Key: "date", Type: FieldTypeDate, DisplayName: "Date"},
		{Key: "files", Type: FieldTypeFileMultiple, DisplayName: "Files"},
	}
}

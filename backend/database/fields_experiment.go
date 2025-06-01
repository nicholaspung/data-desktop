package database

func GetExperimentFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the experiment",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Detailed description of the experiment",
			IsOptional:  true,
		},
		{
			Key:         "start_state",
			Type:        FieldTypeText,
			DisplayName: "Start State",
			Description: "Initial state or baseline of the experiment",
			IsOptional:  true,
		},
		{
			Key:         "end_state",
			Type:        FieldTypeText,
			DisplayName: "End State",
			Description: "Final state or outcome of the experiment",
			IsOptional:  true,
		},
		{
			Key:          "start_date",
			Type:         FieldTypeDate,
			DisplayName:  "Start Date",
			Description:  "When the experiment begins",
			IsSearchable: true,
		},
		{
			Key:          "end_date",
			Type:         FieldTypeDate,
			DisplayName:  "End Date",
			Description:  "When the experiment ends",
			IsSearchable: true,
			IsOptional:   true,
		},
		{
			Key:         "goal",
			Type:        FieldTypeText,
			DisplayName: "Goal",
			Description: "What the experiment aims to achieve",
			IsOptional:  true,
		},
		{
			Key:         "status",
			Type:        FieldTypeText,
			DisplayName: "Status",
			Description: "Current status of the experiment (planning, active, completed, paused)",
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this experiment private?",
		},
	}
}

func GetMetricFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the metric",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Description of what this metric measures",
			IsOptional:  true,
		},
		{
			Key:         "type",
			Type:        FieldTypeText,
			DisplayName: "Type",
			Description: "Type of metric (number, boolean, text, scale)",
		},
		{
			Key:         "unit",
			Type:        FieldTypeText,
			DisplayName: "Unit",
			Description: "Unit of measurement for this metric",
			IsOptional:  true,
		},
		{
			Key:         "default_value",
			Type:        FieldTypeText,
			DisplayName: "Default Value",
			Description: "Default value for this metric",
			IsOptional:  true,
		},
		{
			Key:            "category_id",
			Type:           FieldTypeText,
			DisplayName:    "Category",
			Description:    "Category this metric belongs to",
			IsRelation:     true,
			RelatedDataset: "metric_categories",
			RelatedField:   "id",
			IsOptional:     true,
		},
		{
			Key:         "active",
			Type:        FieldTypeBoolean,
			DisplayName: "Active",
			Description: "Whether this metric is currently active",
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this metric private?",
		},
		{
			Key:         "schedule_start_date",
			Type:        FieldTypeDate,
			DisplayName: "Start Date",
			Description: "When to start showing this metric",
			IsOptional:  true,
		},
		{
			Key:         "schedule_end_date",
			Type:        FieldTypeDate,
			DisplayName: "End Date",
			Description: "When to stop showing this metric",
			IsOptional:  true,
		},
		{
			Key:         "schedule_days",
			Type:        FieldTypeText, // JSON array of day numbers (0=Sunday, 6=Saturday)
			DisplayName: "Schedule Days",
			Description: "Days of week to show this metric",
			IsOptional:  true,
		},
		{
			Key:         "schedule_frequency",
			Type:        FieldTypeText,
			DisplayName: "Frequency",
			Description: "How often to show this metric (daily, weekly, interval, custom)",
			IsOptional:  true,
		},
		{
			Key:         "schedule_interval_value",
			Type:        FieldTypeNumber,
			DisplayName: "Interval Value",
			Description: "Number value for custom interval (e.g., every 3 days/weeks/months)",
			IsOptional:  true,
		},
		{
			Key:         "schedule_interval_unit",
			Type:        FieldTypeText,
			DisplayName: "Interval Unit",
			Description: "Unit for custom interval (days, weeks, months)",
			IsOptional:  true,
		},
		{
			Key:         "goal_type",
			Type:        FieldTypeText,
			DisplayName: "Goal Type",
			Description: "Type of goal (target, minimum, maximum, range)",
			IsOptional:  true,
		},
		{
			Key:         "goal_value",
			Type:        FieldTypeNumber,
			DisplayName: "Goal Value",
			Description: "Target value for the goal",
			IsOptional:  true,
		},
	}
}

func GetDailyLogFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the log entry",
			IsSearchable: true,
		},
		{
			Key:            "metric_id",
			Type:           FieldTypeText,
			DisplayName:    "Metric",
			Description:    "Reference to the metric being logged",
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
		},
		{
			Key:            "experiment_id",
			Type:           FieldTypeText,
			DisplayName:    "Experiment",
			Description:    "Reference to the experiment this log belongs to",
			IsRelation:     true,
			RelatedDataset: "experiments",
			RelatedField:   "id",
			IsOptional:     true,
		},
		{
			Key:         "value",
			Type:        FieldTypeText,
			DisplayName: "Value",
			Description: "Value of the metric for this date",
		},
		{
			Key:         "notes",
			Type:        FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this log entry",
			IsOptional:  true,
		},
		{
			Key:         "goal_value",
			Type:        FieldTypeNumber,
			DisplayName: "Goal Value",
			Description: "Goal value for this specific entry",
			IsOptional:  true,
		},
		{
			Key:         "goal_type",
			Type:        FieldTypeText,
			DisplayName: "Goal Type",
			Description: "Type of goal for this entry",
			IsOptional:  true,
		},
	}
}

func GetMetricCategoryFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the metric category",
			IsSearchable: true,
		},
	}
}

func GetExperimentMetricFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "experiment_id",
			Type:           FieldTypeText,
			DisplayName:    "Experiment",
			Description:    "Reference to the experiment",
			IsRelation:     true,
			RelatedDataset: "experiments",
			RelatedField:   "id",
		},
		{
			Key:            "metric_id",
			Type:           FieldTypeText,
			DisplayName:    "Metric",
			Description:    "Reference to the metric",
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
		},
		{
			Key:         "target",
			Type:        FieldTypeNumber,
			DisplayName: "Target",
			Description: "Target value for this metric in the experiment",
			IsOptional:  true,
		},
		{
			Key:         "target_type",
			Type:        FieldTypeText,
			DisplayName: "Target Type",
			Description: "Type of target (increase, decrease, maintain, range)",
			IsOptional:  true,
		},
		{
			Key:         "importance",
			Type:        FieldTypeText,
			DisplayName: "Importance",
			Description: "Importance level of this metric in the experiment",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this experiment metric private?",
		},
	}
}

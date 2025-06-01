package database

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

func LoadSampleDataOnce() error {

	dexaRecords, err := GetDataRecords(DatasetIDDEXA)
	if err == nil && len(dexaRecords) > 0 {

		return nil
	}

	if err := loadDEXASampleData(); err != nil {
		return fmt.Errorf("failed to load DEXA sample data: %w", err)
	}

	if err := loadBloodworkSampleData(); err != nil {
		return fmt.Errorf("failed to load bloodwork sample data: %w", err)
	}

	if err := loadExperimentSampleData(); err != nil {
		return fmt.Errorf("failed to load experiment sample data: %w", err)
	}

	if err := loadTodoSampleData(); err != nil {
		return fmt.Errorf("failed to load todo sample data: %w", err)
	}

	if err := loadPeopleCRMSampleData(); err != nil {
		return fmt.Errorf("failed to load people CRM sample data: %w", err)
	}

	if err := loadJournalingSampleData(); err != nil {
		return fmt.Errorf("failed to load journaling sample data: %w", err)
	}

	if err := loadTimeTrackingSampleData(); err != nil {
		return fmt.Errorf("failed to load time tracking sample data: %w", err)
	}

	return nil
}

func loadDEXASampleData() error {
	samples := []map[string]interface{}{
		{
			"date":                      "2024-01-15",
			"fasted":                    true,
			"total_body_fat_percentage": 12.5,
			"fat_tissue_lbs":            22.3,
			"lean_tissue_lbs":           155.7,
			"total_mass_lbs":            178.0,
			"bone_mineral_content":      6.2,
			"resting_metabolic_rate":    1850,
			"vat_mass_lbs":              1.2,
			"vat_volume_in3":            45.8,
			"bone_density_g_cm2_total":  1.15,
		},
		{
			"date":                      "2024-06-15",
			"fasted":                    true,
			"total_body_fat_percentage": 11.8,
			"fat_tissue_lbs":            21.1,
			"lean_tissue_lbs":           158.2,
			"total_mass_lbs":            179.3,
			"bone_mineral_content":      6.3,
			"resting_metabolic_rate":    1875,
			"vat_mass_lbs":              1.0,
			"vat_volume_in3":            42.1,
			"bone_density_g_cm2_total":  1.17,
		},
	}

	return addSampleRecords(DatasetIDDEXA, samples)
}

func loadBloodworkSampleData() error {

	bloodMarkers := []map[string]interface{}{
		{
			"name":            "Total Cholesterol",
			"unit":            "mg/dL",
			"lower_reference": 125.0,
			"upper_reference": 200.0,
			"optimal_low":     150.0,
			"optimal_high":    180.0,
			"description":     "Total cholesterol levels in blood",
			"category":        "Lipid Panel",
		},
		{
			"name":            "HDL Cholesterol",
			"unit":            "mg/dL",
			"lower_reference": 40.0,
			"upper_reference": 100.0,
			"optimal_low":     50.0,
			"optimal_high":    80.0,
			"description":     "High-density lipoprotein cholesterol",
			"category":        "Lipid Panel",
		},
		{
			"name":            "LDL Cholesterol",
			"unit":            "mg/dL",
			"lower_reference": 0.0,
			"upper_reference": 100.0,
			"optimal_low":     70.0,
			"optimal_high":    90.0,
			"description":     "Low-density lipoprotein cholesterol",
			"category":        "Lipid Panel",
		},
	}

	if err := addSampleRecords(DatasetIDBloodMarker, bloodMarkers); err != nil {
		return err
	}

	bloodworkSessions := []map[string]interface{}{
		{
			"date":     "2024-03-15",
			"fasted":   true,
			"lab_name": "LabCorp",
			"notes":    "Annual physical exam bloodwork",
		},
		{
			"date":     "2024-09-15",
			"fasted":   true,
			"lab_name": "Quest Diagnostics",
			"notes":    "6-month follow-up",
		},
	}

	return addSampleRecords(DatasetIDBloodwork, bloodworkSessions)
}

func loadExperimentSampleData() error {

	categories := []map[string]interface{}{
		{"name": "Health"},
		{"name": "Productivity"},
		{"name": "Habits"},
		{"name": "Exercise"},
	}

	if err := addSampleRecords(DatasetIDMetricCategory, categories); err != nil {
		return err
	}

	experiments := []map[string]interface{}{
		{
			"name":        "Morning Exercise Routine",
			"description": "Testing the impact of exercising first thing in the morning on energy levels and productivity throughout the day",
			"start_state": "Inconsistent exercise schedule, often feeling sluggish in the morning",
			"goal":        "Increase daily energy levels and morning productivity",
			"start_date":  "2024-01-01",
			"end_date":    "2024-02-01",
			"status":      "completed",
			"private":     false,
		},
		{
			"name":        "Intermittent Fasting 16:8",
			"description": "Trying 16:8 intermittent fasting to see effects on weight, energy, and mental clarity",
			"start_state": "Eating throughout the day, weight stable at 178lbs",
			"goal":        "Lose 5-10 pounds and improve mental clarity",
			"start_date":  "2024-02-15",
			"end_date":    "2024-04-15",
			"status":      "active",
			"private":     false,
		},
	}

	if err := addSampleRecords(DatasetIDExperiment, experiments); err != nil {
		return err
	}

	metrics := []map[string]interface{}{
		{
			"name":          "Energy Level",
			"description":   "Daily energy level on a scale of 1-10",
			"type":          "scale",
			"unit":          "/10",
			"default_value": "5",
			"active":        true,
			"private":       false,
			"goal_type":     "target",
			"goal_value":    8,
		},
		{
			"name":          "Exercise Minutes",
			"description":   "Minutes of exercise completed",
			"type":          "number",
			"unit":          "minutes",
			"default_value": "0",
			"active":        true,
			"private":       false,
			"goal_type":     "minimum",
			"goal_value":    30,
		},
		{
			"name":        "Weight",
			"description": "Daily weight measurement",
			"type":        "number",
			"unit":        "lbs",
			"active":      true,
			"private":     false,
		},
	}

	if err := addSampleRecords(DatasetIDMetric, metrics); err != nil {
		return err
	}

	dailyLogs := []map[string]interface{}{
		{
			"date":  "2024-01-01",
			"value": "7",
			"notes": "Good energy after morning workout",
		},
		{
			"date":  "2024-01-02",
			"value": "6",
			"notes": "Slightly tired but still better than usual",
		},
		{
			"date":  "2024-01-03",
			"value": "8",
			"notes": "Excellent energy all day!",
		},
	}

	return addSampleRecords(DatasetIDDailyLog, dailyLogs)
}

func loadTodoSampleData() error {
	todos := []map[string]interface{}{
		{
			"title":       "Schedule annual physical exam",
			"description": "Need to book appointment with Dr. Smith for yearly checkup",
			"deadline":    "2024-12-31",
			"priority":    "medium",
			"tags":        "health,medical",
			"is_complete": false,
			"status":      "pending",
			"private":     false,
		},
		{
			"title":       "Update resume",
			"description": "Add recent projects and skills to resume",
			"deadline":    "2024-11-15",
			"priority":    "low",
			"tags":        "career,professional",
			"is_complete": false,
			"status":      "pending",
			"private":     false,
		},
		{
			"title":        "Plan weekend hiking trip",
			"description":  "Research trails and book campsite for upcoming weekend",
			"deadline":     "2024-10-20",
			"priority":     "high",
			"tags":         "recreation,planning",
			"is_complete":  true,
			"completed_at": "2024-10-15",
			"status":       "completed",
			"private":      false,
		},
	}

	return addSampleRecords(DatasetIDTodos, todos)
}

func loadPeopleCRMSampleData() error {

	people := []map[string]interface{}{
		{
			"name":           "Sarah Johnson",
			"birthday":       "1990-05-15",
			"address":        "123 Main St, San Francisco, CA",
			"tags":           "friend,college,tech",
			"first_met_date": "2018-09-01",
			"private":        false,
		},
		{
			"name":           "Mike Chen",
			"birthday":       "1988-11-22",
			"address":        "456 Oak Ave, Oakland, CA",
			"tags":           "colleague,mentor,engineering",
			"first_met_date": "2020-01-15",
			"private":        false,
		},
		{
			"name":           "Lisa Williams",
			"birthday":       "1992-03-08",
			"tags":           "family,sister",
			"first_met_date": "1992-03-08",
			"private":        false,
		},
	}

	if err := addSampleRecords(DatasetIDPeople, people); err != nil {
		return err
	}

	meetings := []map[string]interface{}{
		{
			"meeting_date":     "2024-10-01",
			"location":         "Blue Bottle Coffee",
			"location_type":    "in-person",
			"duration_minutes": 90,
			"description":      "Caught up on life, discussed her new job at the startup",
			"tags":             "coffee,catchup",
			"feelings":         "Great to reconnect!",
			"follow_up_needed": false,
			"private":          false,
		},
	}

	if err := addSampleRecords(DatasetIDMeetings, meetings); err != nil {
		return err
	}

	attributes := []map[string]interface{}{
		{
			"attribute_name":  "Favorite Coffee",
			"attribute_value": "Oat milk latte",
			"category":        "preferences",
			"learned_date":    "2024-10-01",
			"notes":           "Always orders this at coffee shops",
			"source":          "Direct observation",
			"private":         false,
		},
		{
			"attribute_name":  "Programming Language",
			"attribute_value": "Python, JavaScript",
			"category":        "professional",
			"learned_date":    "2020-01-15",
			"notes":           "Primary languages used at work",
			"source":          "Work conversation",
			"private":         false,
		},
	}

	if err := addSampleRecords(DatasetIDPersonAttributes, attributes); err != nil {
		return err
	}

	notes := []map[string]interface{}{
		{
			"note_date": "2024-10-01",
			"content":   "Sarah mentioned she's thinking about switching to a new role. Seems excited about opportunities in AI/ML space.",
			"category":  "career",
			"tags":      "career-change,ai,ml",
			"private":   false,
		},
	}

	return addSampleRecords(DatasetIDPersonNotes, notes)
}

func loadJournalingSampleData() error {

	gratitudeEntries := []map[string]interface{}{
		{
			"date":  "2024-10-01",
			"entry": "**Today I'm grateful for:**\n\n- Beautiful sunny weather that made my morning walk so enjoyable\n- Great conversation with Sarah over coffee - it's wonderful to reconnect with old friends\n- Successfully completing the hiking trip project planning",
		},
		{
			"date":  "2024-10-02",
			"entry": "**Three things I'm grateful for today:**\n\n1. Healthy breakfast to start the day right\n2. Productive work session on the new feature - felt really in the flow\n3. Relaxing evening walk in the neighborhood, perfect for clearing my mind",
		},
	}

	if err := addSampleRecords(DatasetIDGratitudeJournal, gratitudeEntries); err != nil {
		return err
	}

	affirmations := []map[string]interface{}{
		{
			"date":        "2024-10-01",
			"affirmation": "I am capable of achieving my goals through consistent daily actions. Each small step I take builds toward something meaningful.",
		},
		{
			"date":        "2024-10-02",
			"affirmation": "I choose to focus on progress, not perfection. Growth comes from embracing challenges and learning from setbacks.",
		},
	}

	if err := addSampleRecords(DatasetIDAffirmation, affirmations); err != nil {
		return err
	}

	creativityEntries := []map[string]interface{}{
		{
			"date":  "2024-10-01",
			"entry": "**Prompt:** Write about a world where gravity works differently\n\n---\n\nIn this world, gravity changes direction every 12 hours. People have adapted by building cities that work both ways up and down. Buildings are designed like hourglasses, with living spaces that can be flipped when gravity reverses.\n\nThe most fascinating part is watching the birds - they've evolved to be perfectly comfortable flying in any direction, creating mesmerizing aerial dances during the transition periods when gravity weakens...",
		},
	}

	if err := addSampleRecords(DatasetIDCreativityJournal, creativityEntries); err != nil {
		return err
	}

	questionEntries := []map[string]interface{}{
		{
			"date":  "2024-10-01",
			"entry": "**Question:** What am I most excited about in the next month?\n\n**My thoughts:**\n\nI'm really excited about the new project at work and the potential learning opportunities it brings. There's something energizing about diving into uncharted territory and figuring things out as I go.\n\nI'm also looking forward to the weekend hiking trips I've been planning. Getting out in nature always helps me reset and gain perspective on everything else in life.",
		},
	}

	return addSampleRecords(DatasetIDQuestionJournal, questionEntries)
}

func loadTimeTrackingSampleData() error {

	categories := []map[string]interface{}{
		{
			"name":    "Deep Work",
			"color":   "#4CAF50",
			"private": false,
		},
		{
			"name":    "Meetings",
			"color":   "#2196F3",
			"private": false,
		},
		{
			"name":    "Exercise",
			"color":   "#FF9800",
			"private": false,
		},
		{
			"name":    "Personal",
			"color":   "#9C27B0",
			"private": false,
		},
	}

	if err := addSampleRecords(DatasetIDTimeCategories, categories); err != nil {
		return err
	}

	timeEntries := []map[string]interface{}{
		{
			"description":      "Working on data desktop sample data feature",
			"start_time":       "2024-10-01T09:00:00Z",
			"end_time":         "2024-10-01T11:30:00Z",
			"duration_minutes": 150,
			"tags":             "coding,feature-development",
			"private":          false,
		},
		{
			"description":      "Team standup meeting",
			"start_time":       "2024-10-01T14:00:00Z",
			"end_time":         "2024-10-01T15:00:00Z",
			"duration_minutes": 60,
			"tags":             "team,standup",
			"private":          false,
		},
		{
			"description":      "Evening workout - strength training",
			"start_time":       "2024-10-01T17:30:00Z",
			"end_time":         "2024-10-01T18:30:00Z",
			"duration_minutes": 60,
			"tags":             "fitness,strength",
			"private":          false,
		},
	}

	return addSampleRecords(DatasetIDTimeEntries, timeEntries)
}

func addSampleRecords(datasetID string, samples []map[string]interface{}) error {
	for _, sample := range samples {
		dataJSON, err := json.Marshal(sample)
		if err != nil {
			return err
		}

		record := DataRecord{
			ID:        generateID(),
			DatasetID: datasetID,
			Data:      dataJSON,
		}

		if err := AddDataRecord(record); err != nil {
			return err
		}
	}

	return nil
}

func generateID() string {
	return uuid.New().String()
}

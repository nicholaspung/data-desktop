package database

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/google/uuid"
)

func LoadSampleDataOnce() error {
	dexaRecords, err := GetDataRecords(DatasetIDDEXA)
	if err == nil && len(dexaRecords) == 0 {
		if err := loadDEXASampleData(); err != nil {
			return fmt.Errorf("failed to load DEXA sample data: %w", err)
		}
	}

	bloodworkRecords, err := GetDataRecords(DatasetIDBloodwork)
	if err == nil && len(bloodworkRecords) == 0 {
		if err := loadBloodworkSampleData(); err != nil {
			return fmt.Errorf("failed to load bloodwork sample data: %w", err)
		}
	}

	experimentRecords, err := GetDataRecords(DatasetIDExperiment)
	if err == nil && len(experimentRecords) == 0 {
		if err := loadExperimentSampleData(); err != nil {
			return fmt.Errorf("failed to load experiment sample data: %w", err)
		}
	}

	todoRecords, err := GetDataRecords(DatasetIDTodos)
	if err == nil && len(todoRecords) == 0 {
		if err := loadTodoSampleData(); err != nil {
			return fmt.Errorf("failed to load todo sample data: %w", err)
		}
	}

	peopleRecords, err := GetDataRecords(DatasetIDPeople)
	if err == nil && len(peopleRecords) == 0 {
		if err := loadPeopleCRMSampleData(); err != nil {
			return fmt.Errorf("failed to load people CRM sample data: %w", err)
		}
	}

	gratitudeRecords, err := GetDataRecords(DatasetIDGratitudeJournal)
	if err == nil && len(gratitudeRecords) == 0 {
		if err := loadJournalingSampleData(); err != nil {
			return fmt.Errorf("failed to load journaling sample data: %w", err)
		}
	}

	timeRecords, err := GetDataRecords(DatasetIDTimeEntries)
	if err == nil && len(timeRecords) == 0 {
		if err := loadTimeTrackingSampleData(); err != nil {
			return fmt.Errorf("failed to load time tracking sample data: %w", err)
		}
	}

	financialRecords, err := GetDataRecords(DatasetIDFinancialLogs)
	if err == nil && len(financialRecords) == 0 {
		if err := loadFinancialSampleData(); err != nil {
			return fmt.Errorf("failed to load financial sample data: %w", err)
		}
	}

	return nil
}

func LoadSampleDataWithDateRange(startDate string, endDate string) error {

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return fmt.Errorf("invalid start date format: %w", err)
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return fmt.Errorf("invalid end date format: %w", err)
	}

	if end.Before(start) {
		return fmt.Errorf("end date must be after start date")
	}

	fmt.Printf("Loading sample data for date range: %s to %s\n", startDate, endDate)

	if DB == nil {
		return fmt.Errorf("database connection is nil")
	}

	err = DB.Ping()
	if err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	fmt.Printf("Database connection verified\n")

	datasets := []struct {
		name string
		fn   func(time.Time, time.Time) error
	}{
		{"DEXA", loadDEXASampleDataWithDates},
		{"Bloodwork", loadBloodworkSampleDataWithDates},
		{"Experiments", loadExperimentSampleDataWithDates},
		{"Todos", loadTodoSampleDataWithDates},
		{"People CRM", loadPeopleCRMSampleDataWithDates},
		{"Journaling", loadJournalingSampleDataWithDates},
		{"Time Tracking", loadTimeTrackingSampleDataWithDates},
		{"Financial", loadFinancialSampleDataWithDates},
		{"Body Measurements", loadBodyMeasurementsSampleDataWithDates},
		{"Daily Journal", loadDailyJournalSampleDataWithDates},
		{"Health Files", loadHealthFilesSampleDataWithDates},
	}

	for _, dataset := range datasets {
		fmt.Printf("Loading %s sample data...\n", dataset.name)
		if err := dataset.fn(start, end); err != nil {
			fmt.Printf("Warning: Failed to load %s sample data: %v\n", dataset.name, err)

			continue
		}
		fmt.Printf("Successfully loaded %s sample data\n", dataset.name)
	}

	fmt.Printf("Sample data loading completed\n")
	return nil
}

func randomDateInRange(start, end time.Time) string {
	delta := end.Unix() - start.Unix()
	sec := rand.Int63n(delta) + start.Unix()
	return time.Unix(sec, 0).Format("2006-01-02")
}

func dateWithVariance(centerDate time.Time, daysBefore, daysAfter int) string {
	variance := rand.Intn(daysBefore+daysAfter+1) - daysBefore
	return centerDate.AddDate(0, 0, variance).Format("2006-01-02")
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

func loadDEXASampleDataWithDates(start, end time.Time) error {

	numScans := rand.Intn(3) + 3
	samples := make([]map[string]interface{}, numScans)

	duration := end.Sub(start)
	interval := duration / time.Duration(numScans)

	baseFatPercentage := 12.0 + rand.Float64()*8.0
	baseLeanMass := 140.0 + rand.Float64()*40.0

	for i := 0; i < numScans; i++ {
		scanDate := start.Add(time.Duration(i) * interval)

		scanDate = scanDate.AddDate(0, 0, rand.Intn(15)-7)

		timeProgress := float64(i) / float64(numScans-1)

		fatPercentage := baseFatPercentage - (rand.Float64()*2.0+1.0)*timeProgress
		leanMass := baseLeanMass + (rand.Float64()*5.0+2.0)*timeProgress
		totalWeight := leanMass / (1 - fatPercentage/100)
		fatMass := totalWeight * (fatPercentage / 100)

		samples[i] = map[string]interface{}{
			"date":                      scanDate.Format("2006-01-02"),
			"fasted":                    rand.Float32() > 0.2,
			"total_body_fat_percentage": fatPercentage,
			"fat_tissue_lbs":            fatMass,
			"lean_tissue_lbs":           leanMass,
			"total_mass_lbs":            totalWeight,
			"bone_mineral_content":      6.0 + rand.Float64()*0.5,
			"resting_metabolic_rate":    1800 + leanMass*2.5 + rand.Float64()*100,
			"vat_mass_lbs":              0.8 + rand.Float64()*0.6,
			"vat_volume_in3":            35.0 + rand.Float64()*20.0,
			"bone_density_g_cm2_total":  1.10 + rand.Float64()*0.15,
		}
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

func loadBloodworkSampleDataWithDates(start, end time.Time) error {

	numSessions := rand.Intn(5) + 4
	bloodworkSessions := make([]map[string]interface{}, numSessions)

	duration := end.Sub(start)
	interval := duration / time.Duration(numSessions)

	bloodMarkers := []struct {
		name string
		min  float64
		max  float64
	}{
		{"Hemoglobin", 13.5, 17.5},
		{"Glucose", 70.0, 100.0},
		{"Total Cholesterol", 150.0, 200.0},
		{"LDL Cholesterol", 70.0, 100.0},
		{"HDL Cholesterol", 40.0, 80.0},
		{"Triglycerides", 50.0, 150.0},
		{"Vitamin D", 30.0, 80.0},
		{"TSH", 0.4, 4.0},
		{"Testosterone", 300.0, 800.0},
	}

	for i := 0; i < numSessions; i++ {
		sessionDate := start.Add(time.Duration(i) * interval)
		sessionDate = sessionDate.AddDate(0, 0, rand.Intn(15)-7)

		results := make([]map[string]interface{}, len(bloodMarkers))
		for j, marker := range bloodMarkers {

			value := marker.min + rand.Float64()*(marker.max-marker.min)
			if rand.Float32() < 0.15 {
				if rand.Float32() < 0.5 {
					value = marker.min - rand.Float64()*(marker.min*0.2)
				} else {
					value = marker.max + rand.Float64()*(marker.max*0.2)
				}
			}

			results[j] = map[string]interface{}{
				"marker_name": marker.name,
				"value":       value,
				"unit":        getMarkerUnit(marker.name),
				"in_range":    value >= marker.min && value <= marker.max,
			}
		}

		bloodworkSessions[i] = map[string]interface{}{
			"date":     sessionDate.Format("2006-01-02"),
			"provider": []string{"LabCorp", "Quest Diagnostics", "Local Hospital Lab", "Primary Care", "Specialist"}[rand.Intn(5)],
			"fasted":   rand.Float32() > 0.3,
			"results":  results,
			"notes":    []string{"Annual checkup", "Follow-up", "Preventive screening", "Monitoring", "Pre-surgery", "Routine physical"}[rand.Intn(6)],
		}
	}

	return addSampleRecords(DatasetIDBloodwork, bloodworkSessions)
}

func getMarkerUnit(markerName string) string {
	units := map[string]string{
		"Hemoglobin":        "g/dL",
		"Glucose":           "mg/dL",
		"Total Cholesterol": "mg/dL",
		"LDL Cholesterol":   "mg/dL",
		"HDL Cholesterol":   "mg/dL",
		"Triglycerides":     "mg/dL",
		"Vitamin D":         "ng/mL",
		"TSH":               "mIU/L",
		"Testosterone":      "ng/dL",
	}
	if unit, exists := units[markerName]; exists {
		return unit
	}
	return ""
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

func loadFinancialSampleData() error {

	financialLogs := []map[string]interface{}{
		{
			"date":        "2024-01-15",
			"amount":      -85.50,
			"description": "Grocery shopping at Whole Foods",
			"category":    "Food & Dining",
			"tags":        "groceries,food,essentials",
		},
		{
			"date":        "2024-01-16",
			"amount":      -45.00,
			"description": "Gas station fill-up",
			"category":    "Transportation",
			"tags":        "gas,car,transportation",
		},
		{
			"date":        "2024-01-17",
			"amount":      5500.00,
			"description": "Monthly salary deposit",
			"category":    "Income",
			"tags":        "salary,income,work",
		},
		{
			"date":        "2024-01-18",
			"amount":      -1200.00,
			"description": "Rent payment - January",
			"category":    "Housing",
			"tags":        "rent,housing,fixed",
		},
		{
			"date":        "2024-01-19",
			"amount":      -75.25,
			"description": "Electric bill - December",
			"category":    "Utilities",
			"tags":        "electricity,utilities,bills",
		},
		{
			"date":        "2024-01-20",
			"amount":      -25.99,
			"description": "Netflix subscription",
			"category":    "Entertainment",
			"tags":        "streaming,entertainment,subscription",
		},
		{
			"date":        "2024-01-22",
			"amount":      -125.00,
			"description": "Gym membership - monthly",
			"category":    "Health & Fitness",
			"tags":        "gym,health,fitness,subscription",
		},
		{
			"date":        "2024-01-25",
			"amount":      -65.75,
			"description": "Coffee shops and lunch",
			"category":    "Food & Dining",
			"tags":        "coffee,lunch,eating-out",
		},
		{
			"date":        "2024-01-30",
			"amount":      -89.99,
			"description": "Online shopping - clothing",
			"category":    "Shopping",
			"tags":        "clothes,online,personal",
		},
		{
			"date":        "2024-02-01",
			"amount":      250.00,
			"description": "Freelance project payment",
			"category":    "Income",
			"tags":        "freelance,side-income,project",
		},
		{
			"date":        "2024-02-05",
			"amount":      -55.30,
			"description": "Pharmacy and personal care",
			"category":    "Health & Fitness",
			"tags":        "pharmacy,health,personal-care",
		},
		{
			"date":        "2024-02-10",
			"amount":      -95.40,
			"description": "Grocery shopping at Trader Joe's",
			"category":    "Food & Dining",
			"tags":        "groceries,food,essentials",
		},
		{
			"date":        "2024-02-15",
			"amount":      5500.00,
			"description": "Monthly salary deposit",
			"category":    "Income",
			"tags":        "salary,income,work",
		},
		{
			"date":        "2024-02-16",
			"amount":      -350.00,
			"description": "Car insurance - 6 months",
			"category":    "Transportation",
			"tags":        "insurance,car,transportation,fixed",
		},
		{
			"date":        "2024-02-20",
			"amount":      -1200.00,
			"description": "Rent payment - February",
			"category":    "Housing",
			"tags":        "rent,housing,fixed",
		},
	}

	if err := addSampleRecords(DatasetIDFinancialLogs, financialLogs); err != nil {
		return err
	}

	financialBalances := []map[string]interface{}{
		{
			"date":          "2024-01-01",
			"amount":        5250.00,
			"account_name":  "Chase Checking",
			"account_type":  "Checking",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-01",
			"amount":        15750.00,
			"account_name":  "Chase Savings",
			"account_type":  "Savings",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-01",
			"amount":        85000.00,
			"account_name":  "Vanguard 401k",
			"account_type":  "Investment",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-15",
			"amount":        4100.00,
			"account_name":  "Chase Checking",
			"account_type":  "Checking",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-15",
			"amount":        16000.00,
			"account_name":  "Chase Savings",
			"account_type":  "Savings",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-31",
			"amount":        6850.00,
			"account_name":  "Chase Checking",
			"account_type":  "Checking",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-31",
			"amount":        16000.00,
			"account_name":  "Chase Savings",
			"account_type":  "Savings",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-01-31",
			"amount":        87500.00,
			"account_name":  "Vanguard 401k",
			"account_type":  "Investment",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-02-15",
			"amount":        5200.00,
			"account_name":  "Chase Checking",
			"account_type":  "Checking",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-02-15",
			"amount":        16250.00,
			"account_name":  "Chase Savings",
			"account_type":  "Savings",
			"account_owner": "Personal",
		},
		{
			"date":          "2024-02-28",
			"amount":        89200.00,
			"account_name":  "Vanguard 401k",
			"account_type":  "Investment",
			"account_owner": "Personal",
		},
	}

	if err := addSampleRecords(DatasetIDFinancialBalances, financialBalances); err != nil {
		return err
	}

	paycheckInfo := []map[string]interface{}{
		{
			"date":           "2024-01-15",
			"amount":         6500.00,
			"category":       "Gross Pay",
			"deduction_type": "Income",
		},
		{
			"date":           "2024-01-15",
			"amount":         -975.00,
			"category":       "Federal Income Tax",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-01-15",
			"amount":         -325.00,
			"category":       "State Income Tax",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-01-15",
			"amount":         -403.00,
			"category":       "Social Security",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-01-15",
			"amount":         -94.25,
			"category":       "Medicare",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-01-15",
			"amount":         -325.00,
			"category":       "401k Contribution",
			"deduction_type": "Investment",
		},
		{
			"date":           "2024-01-15",
			"amount":         -275.00,
			"category":       "Health Insurance",
			"deduction_type": "Benefit",
		},
		{
			"date":           "2024-01-15",
			"amount":         -45.00,
			"category":       "Dental Insurance",
			"deduction_type": "Benefit",
		},
		{
			"date":           "2024-01-15",
			"amount":         -15.00,
			"category":       "Vision Insurance",
			"deduction_type": "Benefit",
		},
		{
			"date":           "2024-02-15",
			"amount":         6500.00,
			"category":       "Gross Pay",
			"deduction_type": "Income",
		},
		{
			"date":           "2024-02-15",
			"amount":         -975.00,
			"category":       "Federal Income Tax",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-02-15",
			"amount":         -325.00,
			"category":       "State Income Tax",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-02-15",
			"amount":         -403.00,
			"category":       "Social Security",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-02-15",
			"amount":         -94.25,
			"category":       "Medicare",
			"deduction_type": "Tax",
		},
		{
			"date":           "2024-02-15",
			"amount":         -325.00,
			"category":       "401k Contribution",
			"deduction_type": "Investment",
		},
		{
			"date":           "2024-02-15",
			"amount":         -275.00,
			"category":       "Health Insurance",
			"deduction_type": "Benefit",
		},
		{
			"date":           "2024-02-15",
			"amount":         -45.00,
			"category":       "Dental Insurance",
			"deduction_type": "Benefit",
		},
		{
			"date":           "2024-02-15",
			"amount":         -15.00,
			"category":       "Vision Insurance",
			"deduction_type": "Benefit",
		},
	}

	if err := addSampleRecords(DatasetIDPaycheckInfo, paycheckInfo); err != nil {
		return err
	}

	financialFiles := []map[string]interface{}{
		{
			"date": "2024-01-31",
			"files": []map[string]interface{}{
				{
					"id":    "f1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6",
					"src":   "/sample-files/bank_statement_jan_2024.pdf",
					"name":  "bank_statement_jan_2024.pdf",
					"type":  "application/pdf",
					"order": 0,
				},
				{
					"id":    "g2b3c4d5-e6f7-8g9h-0i1j-k2l3m4n5o6p7",
					"src":   "/sample-files/credit_card_statement_jan.pdf",
					"name":  "credit_card_statement_jan.pdf",
					"type":  "application/pdf",
					"order": 1,
				},
			},
		},
		{
			"date": "2024-02-15",
			"files": []map[string]interface{}{
				{
					"id":    "h3c4d5e6-f7g8-9h0i-1j2k-l3m4n5o6p7q8",
					"src":   "/sample-files/paystub_feb_15_2024.pdf",
					"name":  "paystub_feb_15_2024.pdf",
					"type":  "application/pdf",
					"order": 0,
				},
			},
		},
		{
			"date": "2024-02-28",
			"files": []map[string]interface{}{
				{
					"id":    "i4d5e6f7-g8h9-0i1j-2k3l-m4n5o6p7q8r9",
					"src":   "/sample-files/tax_documents_2023.pdf",
					"name":  "tax_documents_2023.pdf",
					"type":  "application/pdf",
					"order": 0,
				},
				{
					"id":    "j5e6f7g8-h9i0-1j2k-3l4m-n5o6p7q8r9s0",
					"src":   "/sample-files/w2_form_2023.pdf",
					"name":  "w2_form_2023.pdf",
					"type":  "application/pdf",
					"order": 1,
				},
				{
					"id":    "k6f7g8h9-i0j1-2k3l-4m5n-o6p7q8r9s0t1",
					"src":   "/sample-files/1099_freelance.pdf",
					"name":  "1099_freelance.pdf",
					"type":  "application/pdf",
					"order": 2,
				},
			},
		},
		{
			"date": "2024-01-15",
			"files": []map[string]interface{}{
				{
					"id":    "l7g8h9i0-j1k2-3l4m-5n6o-p7q8r9s0t1u2",
					"src":   "/sample-files/expense_receipts_jan.csv",
					"name":  "expense_receipts_jan.csv",
					"type":  "text/csv",
					"order": 0,
				},
				{
					"id":    "m8h9i0j1-k2l3-4m5n-6o7p-q8r9s0t1u2v3",
					"src":   "/sample-files/restaurant_receipts.pdf",
					"name":  "restaurant_receipts.pdf",
					"type":  "application/pdf",
					"order": 1,
				},
			},
		},
		{
			"date": "2024-02-10",
			"files": []map[string]interface{}{
				{
					"id":    "n9i0j1k2-l3m4-5n6o-7p8q-r9s0t1u2v3w4",
					"src":   "/sample-files/investment_summary_q1.pdf",
					"name":  "investment_summary_q1.pdf",
					"type":  "application/pdf",
					"order": 0,
				},
				{
					"id":    "o0j1k2l3-m4n5-6o7p-8q9r-s0t1u2v3w4x5",
					"src":   "/sample-files/401k_statement.pdf",
					"name":  "401k_statement.pdf",
					"type":  "application/pdf",
					"order": 1,
				},
			},
		},
	}

	return addSampleRecords(DatasetIDFinancialFiles, financialFiles)
}

func addSampleRecords(datasetID string, samples []map[string]interface{}) error {
	if len(samples) == 0 {
		fmt.Printf("No samples to add for dataset %s\n", datasetID)
		return nil
	}

	fmt.Printf("Adding %d sample records to dataset %s\n", len(samples), datasetID)

	for i, sample := range samples {
		dataJSON, err := json.Marshal(sample)
		if err != nil {
			fmt.Printf("Failed to marshal sample %d for dataset %s: %v\n", i, datasetID, err)
			continue
		}

		record := DataRecord{
			ID:        generateID(),
			DatasetID: datasetID,
			Data:      dataJSON,
		}

		if err := AddDataRecord(record); err != nil {
			fmt.Printf("Failed to add sample record %d to dataset %s: %v\n", i, datasetID, err)
			continue
		}
	}

	fmt.Printf("Completed adding sample records to dataset %s\n", datasetID)
	return nil
}

func generateID() string {
	return uuid.New().String()
}

func loadSimpleSampleDataWithDates(start, end time.Time) error {
	fmt.Printf("Creating simple test record for date range %s to %s\n", start.Format("2006-01-02"), end.Format("2006-01-02"))

	samples := []map[string]interface{}{
		{
			"test_field": "test_value",
			"date":       start.Format("2006-01-02"),
			"number":     42.0,
		},
	}

	return addSampleRecords(DatasetIDExperiment, samples)
}

func loadExperimentSampleDataWithDates(start, end time.Time) error {

	experiments := []map[string]interface{}{
		{
			"name":        "Sleep Optimization",
			"description": "Testing different sleep schedules and habits to improve overall energy and wellbeing",
			"start_state": "Inconsistent sleep schedule, often feeling tired during the day",
			"goal":        "Consistent 8-hour sleep schedule with improved energy levels",
			"start_date":  start.Format("2006-01-02"),
			"end_date":    end.Format("2006-01-02"),
			"status":      "active",
			"private":     false,
		},
		{
			"name":        "Morning Exercise Routine",
			"description": "Testing impact of morning workouts on productivity and mood",
			"start_state": "Irregular exercise schedule, low morning energy",
			"goal":        "Consistent morning workouts 5x per week",
			"start_date":  start.Format("2006-01-02"),
			"end_date":    end.AddDate(0, 0, 14).Format("2006-01-02"),
			"status":      "planning",
			"private":     false,
		},
	}

	metrics := []map[string]interface{}{
		{
			"name":        "Sleep Quality",
			"description": "Rate sleep quality on a scale of 1-10",
			"type":        "scale",
			"unit":        "/10",
			"active":      true,
			"private":     false,
			"goal_type":   "target",
			"goal_value":  8.0,
		},
		{
			"name":        "Energy Level",
			"description": "Daily energy rating throughout the day",
			"type":        "scale",
			"unit":        "/10",
			"active":      true,
			"private":     false,
			"goal_type":   "target",
			"goal_value":  7.0,
		},
		{
			"name":        "Exercise Minutes",
			"description": "Total minutes of exercise per day",
			"type":        "number",
			"unit":        "minutes",
			"active":      true,
			"private":     false,
			"goal_type":   "minimum",
			"goal_value":  30.0,
		},
		{
			"name":        "Mood Rating",
			"description": "Overall mood throughout the day",
			"type":        "scale",
			"unit":        "/10",
			"active":      true,
			"private":     false,
		},
	}

	if err := addSampleRecords(DatasetIDExperiment, experiments); err != nil {
		return err
	}

	if err := addSampleRecords(DatasetIDMetric, metrics); err != nil {
		return err
	}

	experimentMetrics := []map[string]interface{}{
		{
			"experiment_id": "sleep-optimization",
			"metric_id":     "sleep-quality",
			"target_value":  8.0,
			"priority":      "high",
		},
		{
			"experiment_id": "sleep-optimization",
			"metric_id":     "energy-level",
			"target_value":  7.0,
			"priority":      "high",
		},
		{
			"experiment_id": "morning-exercise",
			"metric_id":     "exercise-minutes",
			"target_value":  30.0,
			"priority":      "high",
		},
		{
			"experiment_id": "morning-exercise",
			"metric_id":     "mood-rating",
			"target_value":  7.0,
			"priority":      "medium",
		},
	}

	if err := addSampleRecords(DatasetIDExperimentMetric, experimentMetrics); err != nil {
		return err
	}

	metricNames := []string{"sleep-quality", "energy-level", "exercise-minutes", "mood-rating"}
	dailyLogs := []map[string]interface{}{}
	currentDate := start

	for currentDate.Before(end) || currentDate.Equal(end) {

		numLogs := rand.Intn(3) + 1
		for i := 0; i < numLogs; i++ {
			if rand.Float32() < 0.8 {
				metricName := metricNames[rand.Intn(len(metricNames))]
				var value string
				var notes string

				switch metricName {
				case "sleep-quality", "energy-level", "mood-rating":
					value = strconv.Itoa(rand.Intn(4) + 6)
					notes = []string{"Feeling great", "Pretty good", "Average day", "Could be better", "Excellent"}[rand.Intn(5)]
				case "exercise-minutes":
					value = strconv.Itoa(rand.Intn(60) + 15)
					notes = []string{"Morning run", "Gym workout", "Yoga session", "Quick walk", "Strength training"}[rand.Intn(5)]
				}

				dailyLogs = append(dailyLogs, map[string]interface{}{
					"date":      currentDate.Format("2006-01-02"),
					"metric_id": metricName,
					"value":     value,
					"notes":     notes,
				})
			}
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return addSampleRecords(DatasetIDDailyLog, dailyLogs)
}

func loadTodoSampleDataWithDates(start, end time.Time) error {
	todos := []map[string]interface{}{
		{
			"title":       "Review week's goals",
			"description": "Check progress on weekly objectives",
			"deadline":    end.Format("2006-01-02"),
			"priority":    "medium",
			"tags":        "planning,review",
			"is_complete": false,
			"status":      "pending",
			"private":     false,
		},
		{
			"title":       "Plan next experiment",
			"description": "Decide on next personal experiment to try",
			"deadline":    end.AddDate(0, 0, 7).Format("2006-01-02"),
			"priority":    "low",
			"tags":        "experiments,planning",
			"is_complete": false,
			"status":      "pending",
			"private":     false,
		},
	}

	return addSampleRecords(DatasetIDTodos, todos)
}

func loadPeopleCRMSampleDataWithDates(start, end time.Time) error {

	people := []map[string]interface{}{
		{
			"name":           "Alex Chen",
			"birthday":       "1990-03-15",
			"tags":           "colleague,friend",
			"first_met_date": start.AddDate(-1, 0, 0).Format("2006-01-02"),
			"private":        false,
		},
	}

	if err := addSampleRecords(DatasetIDPeople, people); err != nil {
		return err
	}

	meetings := []map[string]interface{}{
		{
			"meeting_date":     randomDateInRange(start, end),
			"location":         "Coffee shop",
			"location_type":    "in-person",
			"duration_minutes": 60,
			"description":      "Casual catch-up meeting",
			"tags":             "casual,catchup",
			"feelings":         "Great conversation!",
			"follow_up_needed": false,
			"private":          false,
		},
	}

	return addSampleRecords(DatasetIDMeetings, meetings)
}

func loadJournalingSampleDataWithDates(start, end time.Time) error {
	gratitudeEntries := []map[string]interface{}{}
	creativityEntries := []map[string]interface{}{}
	questionEntries := []map[string]interface{}{}
	affirmationEntries := []map[string]interface{}{}

	currentDate := start

	gratitudePrompts := []string{
		"**Today I'm grateful for:**\n\n- Beautiful sunny weather that made my morning walk so enjoyable\n- Great conversation with a friend over coffee\n- Making progress on my personal goals",
		"**Three things I appreciate today:**\n\n1. Good health and energy to tackle the day\n2. Delicious and nourishing meals\n3. Comfortable home and peaceful environment",
		"**Grateful moments from today:**\n\n• Learning something new that expanded my perspective\n• Connecting with loved ones and feeling supported\n• Small wins that built momentum toward bigger goals",
		"**Thankful for:**\n\n- The opportunity to grow and challenge myself\n- Kind gestures from strangers that brightened my day\n- Having access to resources and opportunities",
	}

	creativityPrompts := []struct {
		prompt   string
		response string
	}{
		{
			"Write about a world where time moves backwards",
			"In this world, people are born old and wise, gradually becoming younger and more curious. Knowledge flows in reverse - we start with answers and spend our lives discovering the questions. The most respected are the youngest, as they hold the purest wonder about existence...",
		},
		{
			"Describe a color that doesn't exist",
			"Vrimble is the color of possibilities not yet imagined. It shifts between warmth and coolness depending on the observer's dreams. You might catch glimpses of it in the corner of your eye during moments of deep creativity, or feel it in the pause between lightning and thunder...",
		},
		{
			"What would happen if gravity worked differently?",
			"If gravity changed direction with the tides, cities would be built like double-sided coins. People would wear magnetic boots and carry orientation compasses. Art would exist in three dimensions, with sculptures floating between floor and ceiling...",
		},
	}

	questionPrompts := []struct {
		question string
		response string
	}{
		{
			"What am I most excited about in the next month?",
			"I'm really looking forward to diving deeper into my creative projects and seeing where they lead. There's something energizing about having a clear direction and the time to pursue it fully. I'm also excited about the connections I'm building and the conversations that are opening up new perspectives.",
		},
		{
			"How have I grown in the past year?",
			"I've become much more comfortable with uncertainty and change. Where I used to need everything planned out, I now find excitement in adapting and discovering new paths. I've also learned to trust my intuition more and worry less about external validation.",
		},
		{
			"What would I do if I knew I couldn't fail?",
			"I would write that book I've been thinking about for years. I'd travel to places that have always called to me. I'd have deeper conversations with people I care about and be more vulnerable about my dreams and fears. I'd trust my creative instincts completely.",
		},
	}

	affirmationTexts := []string{
		"I am capable of achieving my goals through consistent daily actions. Each small step I take builds toward something meaningful and lasting.",
		"I choose to focus on progress, not perfection. Growth comes from embracing challenges and learning from every experience.",
		"I trust my inner wisdom and intuition. I have everything I need within me to navigate life's complexities with grace and confidence.",
		"I am worthy of love, success, and happiness. I attract positive opportunities and relationships that align with my highest good.",
		"I embrace change as a natural part of growth. I am flexible, resilient, and open to new possibilities that serve my evolution.",
	}

	for currentDate.Before(end) || currentDate.Equal(end) {

		if rand.Float32() < 0.6 {
			gratitudeEntries = append(gratitudeEntries, map[string]interface{}{
				"date":  currentDate.Format("2006-01-02"),
				"entry": gratitudePrompts[rand.Intn(len(gratitudePrompts))],
			})
		}

		if rand.Float32() < 0.3 {
			prompt := creativityPrompts[rand.Intn(len(creativityPrompts))]
			creativityEntries = append(creativityEntries, map[string]interface{}{
				"date":   currentDate.Format("2006-01-02"),
				"prompt": prompt.prompt,
				"entry":  prompt.response,
			})
		}

		if rand.Float32() < 0.4 {
			question := questionPrompts[rand.Intn(len(questionPrompts))]
			questionEntries = append(questionEntries, map[string]interface{}{
				"date":     currentDate.Format("2006-01-02"),
				"question": question.question,
				"entry":    question.response,
			})
		}

		if rand.Float32() < 0.5 {
			affirmationEntries = append(affirmationEntries, map[string]interface{}{
				"date":        currentDate.Format("2006-01-02"),
				"affirmation": affirmationTexts[rand.Intn(len(affirmationTexts))],
			})
		}

		currentDate = currentDate.AddDate(0, 0, 1)
	}

	if err := addSampleRecords(DatasetIDGratitudeJournal, gratitudeEntries); err != nil {
		return err
	}

	if err := addSampleRecords(DatasetIDCreativityJournal, creativityEntries); err != nil {
		return err
	}

	if err := addSampleRecords(DatasetIDQuestionJournal, questionEntries); err != nil {
		return err
	}

	return addSampleRecords(DatasetIDAffirmation, affirmationEntries)
}

func loadTimeTrackingSampleDataWithDates(start, end time.Time) error {
	categories := []map[string]interface{}{
		{"name": "Work", "color": "#4CAF50", "private": false},
		{"name": "Personal", "color": "#2196F3", "private": false},
	}

	if err := addSampleRecords(DatasetIDTimeCategories, categories); err != nil {
		return err
	}

	timeEntries := []map[string]interface{}{}
	currentDate := start

	for currentDate.Before(end) || currentDate.Equal(end) {

		numEntries := rand.Intn(3) + 1
		for i := 0; i < numEntries; i++ {
			hour := rand.Intn(10) + 9
			startTime := currentDate.Add(time.Duration(hour) * time.Hour)
			duration := rand.Intn(120) + 30
			endTime := startTime.Add(time.Duration(duration) * time.Minute)

			timeEntries = append(timeEntries, map[string]interface{}{
				"description":      []string{"Focused work session", "Meeting", "Research", "Planning"}[rand.Intn(4)],
				"start_time":       startTime.Format(time.RFC3339),
				"end_time":         endTime.Format(time.RFC3339),
				"duration_minutes": duration,
				"tags":             []string{"productive", "focused", "collaborative", "planning"}[rand.Intn(4)],
				"private":          false,
			})
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return addSampleRecords(DatasetIDTimeEntries, timeEntries)
}

func loadFinancialSampleDataWithDates(start, end time.Time) error {
	financialLogs := []map[string]interface{}{}
	currentDate := start

	for currentDate.Before(end) || currentDate.Equal(end) {

		numTransactions := rand.Intn(3) + 1
		for i := 0; i < numTransactions; i++ {
			amount := (rand.Float64() * 100) + 10
			if rand.Float32() < 0.8 {
				amount = -amount
			}

			financialLogs = append(financialLogs, map[string]interface{}{
				"date":        currentDate.Format("2006-01-02"),
				"amount":      amount,
				"description": []string{"Groceries", "Coffee", "Gas", "Lunch", "Shopping"}[rand.Intn(5)],
				"category":    []string{"Food & Dining", "Transportation", "Shopping", "Entertainment"}[rand.Intn(4)],
				"tags":        []string{"essential", "discretionary", "work", "personal"}[rand.Intn(4)],
			})
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return addSampleRecords(DatasetIDFinancialLogs, financialLogs)
}

func loadBodyMeasurementsSampleDataWithDates(start, end time.Time) error {

	measurements := []map[string]interface{}{}
	currentDate := start

	baseWeight := 150.0 + rand.Float64()*50.0
	baseWaist := 30.0 + rand.Float64()*10.0
	baseChest := 36.0 + rand.Float64()*10.0
	baseBicep := 12.0 + rand.Float64()*6.0

	for currentDate.Before(end) {

		progress := currentDate.Sub(start).Hours() / end.Sub(start).Hours()

		measurement := map[string]interface{}{
			"date":        currentDate.Format("2006-01-02"),
			"weight":      baseWeight - rand.Float64()*5.0*progress,
			"waist":       baseWaist - rand.Float64()*2.0*progress,
			"chest":       baseChest + rand.Float64()*2.0*progress,
			"bicep_left":  baseBicep + rand.Float64()*1.0*progress,
			"bicep_right": baseBicep + rand.Float64()*1.0*progress,
			"thigh_left":  20.0 + rand.Float64()*4.0,
			"thigh_right": 20.0 + rand.Float64()*4.0,
			"calf_left":   14.0 + rand.Float64()*2.0,
			"calf_right":  14.0 + rand.Float64()*2.0,
			"neck":        15.0 + rand.Float64()*2.0,
			"notes":       []string{"Morning measurement", "After workout", "Weekly check-in", ""}[rand.Intn(4)],
		}

		measurements = append(measurements, measurement)

		currentDate = currentDate.AddDate(0, 0, rand.Intn(5)+3)
	}

	return addSampleRecords(DatasetIDBodyMeasurements, measurements)
}

func loadDailyJournalSampleDataWithDates(start, end time.Time) error {
	journals := []map[string]interface{}{}
	currentDate := start

	prompts := []string{
		"What are you grateful for today?",
		"What challenged you today and how did you overcome it?",
		"Describe a moment that made you smile today.",
		"What did you learn about yourself today?",
		"How did you make progress toward your goals today?",
	}

	for currentDate.Before(end) {

		if rand.Float32() < 0.7 {
			journal := map[string]interface{}{
				"date":   currentDate.Format("2006-01-02"),
				"prompt": prompts[rand.Intn(len(prompts))],
				"entry":  generateJournalEntry(),
				"mood":   []string{"great", "good", "okay", "challenging", "difficult"}[rand.Intn(5)],
				"tags":   generateTags(),
			}
			journals = append(journals, journal)
		}

		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return addSampleRecords(DatasetIDDailyJournal, journals)
}

func loadHealthFilesSampleDataWithDates(start, end time.Time) error {
	files := []map[string]interface{}{}

	numFiles := rand.Intn(6) + 5
	duration := end.Sub(start)
	interval := duration / time.Duration(numFiles)

	fileTypes := []string{"Lab Report", "Medical Record", "Prescription", "Imaging", "Insurance Document", "Doctor's Note"}

	for i := 0; i < numFiles; i++ {
		fileDate := start.Add(time.Duration(i) * interval)
		fileDate = fileDate.AddDate(0, 0, rand.Intn(15)-7)

		file := map[string]interface{}{
			"date":        fileDate.Format("2006-01-02"),
			"name":        fmt.Sprintf("%s_%s.pdf", fileTypes[rand.Intn(len(fileTypes))], fileDate.Format("20060102")),
			"type":        fileTypes[rand.Intn(len(fileTypes))],
			"provider":    []string{"Primary Care", "Specialist", "Lab", "Hospital", "Pharmacy"}[rand.Intn(5)],
			"description": generateFileDescription(),
			"tags":        []string{"important", "follow-up", "reference", "archive"}[rand.Intn(4)],
		}

		files = append(files, file)
	}

	return addSampleRecords(DatasetIDHealthFiles, files)
}

func generateJournalEntry() string {
	entries := []string{
		"Today was productive. Completed several important tasks and made good progress on my goals.",
		"Feeling grateful for the support of friends and family. Had a meaningful conversation that gave me new perspective.",
		"Challenged myself to try something new today. It was uncomfortable at first but I'm glad I did it.",
		"Reflected on recent progress and realized how far I've come. Small steps really do add up over time.",
		"Had some setbacks today but learned valuable lessons. Tomorrow is a fresh start.",
	}
	return entries[rand.Intn(len(entries))]
}

func generateTags() []string {
	allTags := []string{"reflection", "gratitude", "growth", "challenge", "success", "learning", "health", "relationships", "work", "personal"}
	numTags := rand.Intn(3) + 1
	tags := make([]string, numTags)
	for i := 0; i < numTags; i++ {
		tags[i] = allTags[rand.Intn(len(allTags))]
	}
	return tags
}

func generateFileDescription() string {
	descriptions := []string{
		"Annual physical exam results",
		"Blood work analysis",
		"Specialist consultation notes",
		"Prescription medication information",
		"Insurance claim documentation",
		"Medical imaging results",
		"Vaccination records",
		"Treatment plan summary",
	}
	return descriptions[rand.Intn(len(descriptions))]
}

func FixStringToNumberData() error {
	fmt.Printf("Starting data type fix...\n")

	numericFields := map[string][]string{
		DatasetIDDEXA: {
			"total_body_fat_percentage", "fat_tissue_lbs", "lean_tissue_lbs",
			"total_mass_lbs", "bone_mineral_content", "resting_metabolic_rate",
			"vat_mass_lbs", "vat_volume_in3", "bone_density_g_cm2_total",
		},
		DatasetIDBodyMeasurements: {
			"weight", "waist", "chest", "bicep_left", "bicep_right",
			"thigh_left", "thigh_right", "calf_left", "calf_right", "neck",
		},
		DatasetIDBloodwork: {},
	}

	totalFixed := 0
	for datasetID, fields := range numericFields {
		fmt.Printf("Processing dataset: %s\n", datasetID)
		records, err := GetDataRecords(datasetID)
		if err != nil {
			fmt.Printf("Error getting records for %s: %v\n", datasetID, err)
			continue
		}
		fmt.Printf("Found %d records in %s\n", len(records), datasetID)

		for i, record := range records {
			var data map[string]interface{}
			if err := json.Unmarshal(record.Data, &data); err != nil {
				fmt.Printf("Error unmarshaling record %d: %v\n", i, err)
				continue
			}

			modified := false
			recordFixed := 0

			for _, field := range fields {
				if value, exists := data[field]; exists {
					if strValue, isString := value.(string); isString {
						if numValue, err := strconv.ParseFloat(strValue, 64); err == nil {
							fmt.Printf("Converting %s.%s from string '%s' to number %f\n", datasetID, field, strValue, numValue)
							data[field] = numValue
							modified = true
							recordFixed++
						}
					}
				}
			}

			if datasetID == DatasetIDBloodwork {
				if results, exists := data["results"]; exists {
					if resultsArray, ok := results.([]interface{}); ok {
						for j, result := range resultsArray {
							if resultMap, ok := result.(map[string]interface{}); ok {
								if value, exists := resultMap["value"]; exists {
									if strValue, isString := value.(string); isString {
										if numValue, err := strconv.ParseFloat(strValue, 64); err == nil {
											fmt.Printf("Converting bloodwork result %d value from string '%s' to number %f\n", j, strValue, numValue)
											resultMap["value"] = numValue
											modified = true
											recordFixed++
										}
									}
								}
							}
						}
					}
				}
			}

			if modified {
				newData, err := json.Marshal(data)
				if err != nil {
					fmt.Printf("Error marshaling updated data: %v\n", err)
					continue
				}

				record.Data = newData
				if err := UpdateDataRecord(record); err != nil {
					return fmt.Errorf("failed to update record %s: %w", record.ID, err)
				}
				fmt.Printf("Updated record %d with %d field conversions\n", i, recordFixed)
				totalFixed += recordFixed
			}
		}
	}

	fmt.Printf("Data type fix completed. Total fields converted: %d\n", totalFixed)
	return nil
}

package database

import (
	"encoding/json"
	"fmt"

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

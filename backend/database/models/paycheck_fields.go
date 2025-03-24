// backend/database/models/paycheck_fields.go
package models

import (
	"myproject/backend/database"
)

// GetPaycheckFields returns the field definitions for the Paycheck dataset
// Note: Keep these in sync with paycheck field definitions in the frontend
func GetPaycheckFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Paycheck date",
			IsSearchable: true,
		},
		{
			Key:          "gross_income",
			Type:         database.FieldTypeNumber,
			DisplayName:  "Gross Income",
			Unit:         "$",
			Description:  "Gross income before any deductions",
			IsSearchable: true,
		},
		{
			Key:         "federal_tax",
			Type:        database.FieldTypeNumber,
			DisplayName: "Federal Tax",
			Unit:        "$",
			Description: "Federal income tax withheld",
		},
		{
			Key:         "state_tax",
			Type:        database.FieldTypeNumber,
			DisplayName: "State Tax",
			Unit:        "$",
			Description: "State income tax withheld",
		},
		{
			Key:         "medicare",
			Type:        database.FieldTypeNumber,
			DisplayName: "Medicare",
			Unit:        "$",
			Description: "Medicare tax withheld",
		},
		{
			Key:         "social_security",
			Type:        database.FieldTypeNumber,
			DisplayName: "Social Security",
			Unit:        "$",
			Description: "Social Security tax withheld",
		},
		{
			Key:         "retirement_401k",
			Type:        database.FieldTypeNumber,
			DisplayName: "401(k) Contribution",
			Unit:        "$",
			Description: "401(k) retirement contribution",
		},
		{
			Key:         "health_insurance",
			Type:        database.FieldTypeNumber,
			DisplayName: "Health Insurance",
			Unit:        "$",
			Description: "Health insurance premium",
		},
		{
			Key:          "net_income",
			Type:         database.FieldTypeNumber,
			DisplayName:  "Net Income",
			Unit:         "$",
			Description:  "Net income after all deductions",
			IsSearchable: true,
		},
		// Add more paycheck fields as needed
	}
}

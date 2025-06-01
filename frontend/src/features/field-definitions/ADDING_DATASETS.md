# Field Definitions - Adding New Datasets

This directory contains the dataset management system for Data Desktop. Adding a new dataset requires both backend and frontend changes.

## 🚀 How to Add a New Dataset

### Step 1: Create Backend Field Definitions

Create a new field definition file in the backend:

**File: `/backend/database/fields_my_feature.go`**

```go
package database

func GetMyFeatureFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the feature item",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        FieldTypeMarkdown,
			DisplayName: "Description",
			Description: "Detailed description of the feature",
			IsOptional:  true,
		},
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date when this was created",
			IsSearchable: true,
		},
		{
			Key:         "value",
			Type:        FieldTypeNumber,
			DisplayName: "Value",
			Description: "Numeric value for this item",
			Unit:        "units",
			IsOptional:  true,
		},
		{
			Key:         "active",
			Type:        FieldTypeBoolean,
			DisplayName: "Active",
			Description: "Whether this item is currently active",
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this item private?",
		},
		// Relationship field example
		{
			Key:            "category_id",
			Type:           FieldTypeText,
			DisplayName:    "Category",
			Description:    "Category this item belongs to",
			IsRelation:     true,
			RelatedDataset: "my_categories",
			RelatedField:   "id",
			IsOptional:     true,
		},
	}
}

func GetMyCategoriesFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the category",
			IsSearchable: true,
		},
		{
			Key:         "color",
			Type:        FieldTypeText,
			DisplayName: "Color",
			Description: "Color hex code for the category",
			IsOptional:  true,
		},
	}
}
```

### Step 2: Add Dataset Constants

Add your dataset IDs to `/backend/database/constants.go`:

```go
const (
	// ... existing constants
	DatasetIDMyFeature    = "my_feature"
	DatasetIDMyCategories = "my_categories"
)
```

### Step 3: Register Dataset Definitions

Add your datasets to `/backend/database/dataset_definitions.go`:

```go
func GetAllDatasetDefinitions() []DatasetConfig {
	return []DatasetConfig{
		// ... existing datasets
		{
			ID:          DatasetIDMyFeature,
			Name:        "My Feature",
			Description: "Custom feature for tracking my data",
			Type:        DatasetTypeMyFeature, // You may need to add this type
			Fields:      GetMyFeatureFields(),
		},
		{
			ID:          DatasetIDMyCategories,
			Name:        "My Categories",
			Description: "Categories for organizing my feature data",
			Type:        DatasetTypeMyFeature,
			Fields:      GetMyCategoriesFields(),
		},
	}
}
```

### Step 4: Add Sample Data (Optional)

Add sample data to `/backend/database/sample_data.go`:

```go
func loadMyFeatureSampleData() error {
	// Create categories first (for relationships)
	categories := []map[string]interface{}{
		{
			"name":  "Category A",
			"color": "#4CAF50",
		},
		{
			"name":  "Category B", 
			"color": "#2196F3",
		},
	}

	if err := addSampleRecords(DatasetIDMyCategories, categories); err != nil {
		return err
	}

	// Create main feature data
	featureData := []map[string]interface{}{
		{
			"name":        "Sample Feature Item",
			"description": "This is a **sample** feature item with markdown support",
			"date":        "2024-10-01",
			"value":       42.5,
			"active":      true,
			"private":     false,
		},
		{
			"name":        "Another Feature Item",
			"description": "Another example with different values",
			"date":        "2024-10-02", 
			"value":       17.3,
			"active":      true,
			"private":     false,
		},
	}

	return addSampleRecords(DatasetIDMyFeature, featureData)
}

// Don't forget to call this in LoadSampleDataOnce()
func LoadSampleDataOnce() error {
	// ... existing sample data loading
	
	if err := loadMyFeatureSampleData(); err != nil {
		return fmt.Errorf("failed to load my feature sample data: %w", err)
	}

	return nil
}
```

### Step 5: Create Frontend Definitions

Create the frontend field definitions in `/frontend/src/features/field-definitions/`:

**File: `my-feature-definitions.ts`**

```typescript
import { FieldDefinitionsDataset } from "@/types/types";

export const MY_FEATURE_DEFINITIONS: FieldDefinitionsDataset = {
  id: "my_feature",
  name: "My Feature",
  description: "Custom feature for tracking my data",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the feature item",
      isSearchable: true,
    },
    {
      key: "description",
      type: "markdown",
      displayName: "Description", 
      description: "Detailed description of the feature",
      isOptional: true,
    },
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date when this was created",
      isSearchable: true,
    },
    {
      key: "value",
      type: "number",
      displayName: "Value",
      description: "Numeric value for this item",
      unit: "units",
      isOptional: true,
    },
    {
      key: "active",
      type: "boolean",
      displayName: "Active",
      description: "Whether this item is currently active",
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private", 
      description: "Is this item private?",
    },
    {
      key: "category_id",
      type: "text",
      displayName: "Category",
      description: "Category this item belongs to",
      isRelation: true,
      relatedDataset: "my_categories",
      relatedField: "id",
      isOptional: true,
    },
  ],
};

export const MY_CATEGORIES_DEFINITIONS: FieldDefinitionsDataset = {
  id: "my_categories",
  name: "My Categories",
  description: "Categories for organizing my feature data",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the category",
      isSearchable: true,
    },
    {
      key: "color",
      type: "text",
      displayName: "Color",
      description: "Color hex code for the category",
      isOptional: true,
    },
  ],
};
```

### Step 6: Register Frontend Definitions

Add your definitions to the registry in `field-definitions-store.ts`:

```typescript
// Import your new definitions
import { MY_FEATURE_DEFINITIONS, MY_CATEGORIES_DEFINITIONS } from "./my-feature-definitions";

const ALL_DEFINITIONS = [
  // ... existing definitions
  MY_FEATURE_DEFINITIONS,
  MY_CATEGORIES_DEFINITIONS,
];
```

### That's It! 🎉

Your new dataset will automatically:
- ✅ Appear in the dataset selector UI
- ✅ Work with all data store operations
- ✅ Have loading state management
- ✅ Support all field types and relationships
- ✅ Include sample data in development mode

## 🔧 Field Type Reference

### Available Field Types
Based on the current Data Desktop implementation:

```typescript
type FieldType = 
  | "date"         // Date picker
  | "boolean"      // Checkbox
  | "number"       // Numeric input
  | "percentage"   // Percentage input (0-100)
  | "text"         // Text input
  | "markdown"     // Markdown editor
  | "json"         // JSON editor
  | "file"         // Single file upload
  | "file-multiple" // Multiple file upload
```

### Real Examples from Data Desktop

**DEXA Scan Fields:**
```typescript
{
  key: "total_body_fat_percentage",
  type: "percentage",
  displayName: "Total Fat %",
  description: "Total body fat percentage",
  isOptional: true,
}
```

**Bloodwork Fields:**
```typescript
{
  key: "fasted",
  type: "boolean", 
  displayName: "Fasted",
  description: "Whether the test was taken while fasting",
}
```

**Relationship Fields:**
```typescript
{
  key: "metric_id",
  type: "text",
  displayName: "Metric",
  description: "Reference to the metric being logged",
  isRelation: true,
  relatedDataset: "metrics",
  relatedField: "id",
}
```

## 📁 Current Dataset Structure

Data Desktop currently includes these datasets:

### Health & Fitness
- **`dexa`** - DEXA scan body composition data
- **`bloodwork`** - Blood test sessions
- **`blood_markers`** - Blood marker definitions with reference ranges
- **`blood_results`** - Individual blood test results

### Experiments & Metrics
- **`experiments`** - Personal experiments and trials
- **`metrics`** - Daily tracking metrics
- **`daily_logs`** - Daily metric entries
- **`metric_categories`** - Categories for organizing metrics
- **`experiment_metrics`** - Links between experiments and metrics

### Journaling
- **`gratitude_journal`** - Daily gratitude entries
- **`affirmation`** - Daily affirmations
- **`creativity_journal`** - Creative writing entries
- **`question_journal`** - Reflective question responses

### Time & Productivity
- **`time_entries`** - Time tracking entries
- **`time_categories`** - Categories for time activities
- **`time_planner_configs`** - Time planner templates
- **`todos`** - Task and todo management

### People & Relationships
- **`people`** - Contact information
- **`meetings`** - Meeting records
- **`person_attributes`** - Personal attributes of contacts
- **`person_notes`** - Notes about contacts
- **`birthday_reminders`** - Birthday reminders
- **`person_relationships`** - Relationships between contacts

## 💡 Best Practices

1. **Consistent Naming**: Use snake_case for dataset IDs to match backend
2. **Field Keys**: Use descriptive field keys that match backend exactly
3. **Relationships**: Always include `isRelation: true`, `relatedDataset`, and `relatedField`
4. **Types**: Use appropriate field types for better UX
5. **Sample Data**: Include realistic sample data for development
6. **Documentation**: Add descriptions for complex fields

## 🐛 Troubleshooting

- **Dataset not appearing**: Ensure it's added to both backend `GetAllDatasetDefinitions()` and frontend `ALL_DEFINITIONS`
- **Field mismatch**: Verify field keys match exactly between backend and frontend
- **Relationship issues**: Check that `relatedDataset` ID exists and is spelled correctly
- **Sample data errors**: Ensure sample data matches field types and required fields
- **Build errors**: Run `go build` to check for backend compilation issues

## 🔄 Development Workflow

1. Add backend field definitions first
2. Test with `wails dev -appargs dev` to verify backend works
3. Add frontend definitions
4. Test in the UI to ensure everything works
5. Add sample data for easier development
6. Document any special requirements or relationships
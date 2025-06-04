# Adding New Datasets - Ultra-Simplified Guide

---

## 🚀 How to Add a New Dataset

### Step 1: Add Dataset ID Constant
In `backend/database/constants.go`:
```go
const (
    // ... existing constants
    DatasetIDMyNewDataset = "my_new_dataset"
)
```

### Step 2: Add to Unified Definitions File
In `backend/database/dataset_definitions.go`, add two things:

**A) Create field function:**
```go
func getMyNewDatasetFieldsInline() []FieldDefinition {
    return []FieldDefinition{
        {Key: "name", Type: FieldTypeText, DisplayName: "Name", IsSearchable: true},
        {Key: "description", Type: FieldTypeMarkdown, DisplayName: "Description"},
        {Key: "created_date", Type: FieldTypeDate, DisplayName: "Created Date"},
        // Add more fields as needed
    }
}
```

**B) Add to registry:**
```go
// In GetAllDatasetDefinitions() function, add:
{
    ID:          DatasetIDMyNewDataset,
    Name:        "My New Dataset",
    Description: "Description of what this dataset stores",
    Type:        DatasetTypeDating, // or DatasetTypeConfig
    Fields:      getMyNewDatasetFieldsInline(),
},
```

### Step 3: Add to Cleanup Function
In `backend/database/cleanup_unused_tables.go`, add your new dataset ID to the `coreDatasetIDs` slice:
```go
coreDatasetIDs := []string{
    // ... existing dataset IDs
    DatasetIDMyNewDataset,
}
```

## 🎉 That's it!
Your dataset will automatically be:
- ✅ Created in the database on app startup
- ✅ Available in the frontend
- ✅ Synced with any field changes
- ✅ No manual registration needed!

## 📝 Available Field Types
```go
FieldTypeText          // Text input
FieldTypeMarkdown      // Markdown/textarea
FieldTypeNumber        // Number input  
FieldTypeDate          // Date picker
FieldTypeBoolean       // Checkbox
FieldTypeImage         // Single image upload
FieldTypeImageMultiple // Multiple image upload
FieldTypeFile          // File upload
FieldTypeJSON          // JSON editor
```

## 🔗 For Relations
```go
{
    Key: "related_item",
    Type: FieldTypeText,
    DisplayName: "Related Item",
    IsRelation: true,
    RelatedDataset: DatasetIDOtherDataset,
    RelatedField: "name",
}
```
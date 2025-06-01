# Field Definitions - Adding New Datasets

This directory contains the automated dataset management system. Adding a new dataset is now streamlined to require minimal file modifications.

## 🚀 How to Add a New Dataset

### Step 1: Create the Dataset Definition

Add your new dataset definition to the appropriate file:

- **For dating-related datasets**: Add to `dating-definitions.ts`
- **For quick/config datasets**: Add to `quick-definitions.ts`

**Example (Simple approach):**
```typescript
export const MY_NEW_DATASET_DEFINITIONS: FieldDefinitionsDataset = {
  id: "my_new_dataset",
  name: "My New Dataset",
  description: "Description of what this dataset contains",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name field",
      isSearchable: true,
    },
    {
      key: "relatedField",
      type: "text",
      displayName: "Related Field",
      isRelation: true,
      relatedDataset: "other_dataset",
      relatedField: "id",
      preventDeleteIfReferenced: true, // OR cascadeDeleteIfReferenced: true
    },
    // ... more fields
  ],
};
```

**Example (Using helper utilities for type safety):**
```typescript
import { FieldDefinitionsDataset, DATASET_REFERENCES, createRelationField } from "@/types/types";

export const MY_NEW_DATASET_DEFINITIONS: FieldDefinitionsDataset = {
  id: "my_new_dataset",
  name: "My New Dataset", 
  description: "Description of what this dataset contains",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name field",
      isSearchable: true,
    },
    // Type-safe relation field with autocomplete
    createRelationField(
      "ethnicityId",
      "Ethnicity", 
      DATASET_REFERENCES.ETHNICITY,
      {
        description: "Related ethnicity",
        deleteBehavior: "preventDeleteIfReferenced"
      }
    ),
    createRelationField(
      "profileId",
      "Dating Profile",
      DATASET_REFERENCES.DATING_PROFILES,
      {
        description: "Related dating profile",
        deleteBehavior: "cascadeDeleteIfReferenced"
      }
    ),
    // ... more fields
  ],
};
```

### Step 2: Register in the Auto-Registry

Add your new definition to the `ALL_DEFINITIONS` array in `field-definitions-store.ts`:

```typescript
const ALL_DEFINITIONS = [
  ETHNICITY_DEFINITIONS,
  REACH_OUT_DEFINITIONS,
  // ... existing definitions
  MY_NEW_DATASET_DEFINITIONS, // Add your new definition here
];
```

### That's It! 🎉

Your new dataset will automatically:
- ✅ Appear in the dataset selector UI
- ✅ Work with all data store operations
- ✅ Have loading state management
- ✅ Support all field types and relationships
- ✅ Include cascade delete and prevent delete functionality

## 🔧 Field Properties Reference

### Basic Properties
- `key`: Unique identifier for the field
- `type`: Field type (text, number, date, boolean, etc.)
- `displayName`: Human-readable name shown in UI
- `description`: Optional description for the field
- `isSearchable`: Whether this field can be searched
- `isOptional`: Whether this field is optional

### Relationship Properties
- `isRelation`: Set to true for relationship fields
- `relatedDataset`: ID of the dataset this field references
- `relatedField`: Field in the related dataset (usually "id")

### Delete Behavior Properties
**⚠️ These are mutually exclusive - use only one per field:**

- `preventDeleteIfReferenced: true`: Prevents deletion of referenced records
  - Use when deleting the referenced record would break data integrity
  - Example: Prevent deleting an ethnicity if it's used in matches

- `cascadeDeleteIfReferenced: true`: Deletes all records that reference the deleted record
  - Use when child records should be deleted with the parent
  - Example: Delete all chats when a match is deleted

## 📁 File Structure

```
field-definitions/
├── README.md                     # This file
├── dating-definitions.ts         # Dating-related dataset definitions
├── quick-definitions.ts          # Quick/config dataset definitions
└── field-definitions-store.ts    # Auto-registry and store management
```

## 🔄 How the Auto-Registry Works

1. **Single Source of Truth**: All definitions are imported into `ALL_DEFINITIONS` array
2. **Dynamic Generation**: Store states are generated from this array
3. **Type Safety**: TypeScript types are derived from the registry
4. **UI Auto-Update**: Dataset selector automatically includes new datasets

## 🎯 New Type Safety Features

### Dataset Reference Utilities
- **`DatasetId` type**: Autocomplete for all available dataset IDs
- **`DATASET_REFERENCES`**: Pre-defined references to common datasets
- **`createRelationField()`**: Helper function for type-safe relation fields
- **`RelationshipDeleteBehavior`**: Type-safe delete behavior options

### Benefits
- ✅ **Autocomplete**: IDE suggestions for dataset IDs and field names
- ✅ **Type Safety**: Compile-time errors for invalid references
- ✅ **Consistency**: Standardized relation field creation
- ✅ **Refactoring**: Easier to rename datasets across the codebase

## 💡 Best Practices

1. **Use descriptive IDs**: Use snake_case for dataset IDs (e.g., `dating_messages`)
2. **Consistent naming**: Match ID with the definition variable name
3. **Type-safe relations**: Use `DATASET_REFERENCES` and `createRelationField()` for better autocomplete
4. **Delete behavior**: Choose appropriate delete behavior for relationships
5. **Descriptions**: Add helpful descriptions for complex fields

## 🐛 Troubleshooting

- **Dataset not appearing**: Ensure it's added to `ALL_DEFINITIONS` array
- **TypeScript errors**: Make sure imports are correct in `field-definitions-store.ts`
- **Delete conflicts**: Check that only one delete behavior property is set per field
- **Relationship issues**: Verify `relatedDataset` ID matches exactly
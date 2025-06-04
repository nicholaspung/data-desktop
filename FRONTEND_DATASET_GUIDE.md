# Frontend Dataset Integration Guide

This guide walks through all the steps needed to add a new dataset to the frontend of the Data Desktop application.

## Prerequisites

Before adding a frontend dataset, ensure the backend dataset is already defined:
- Backend dataset definition in `backend/database/dataset_definitions.go`
- Backend field definitions in `backend/database/fields_*.go`
- Backend constants in `backend/database/constants.go`

## Step-by-Step Frontend Integration

### 1. Create Data Type Definition

**File:** `frontend/src/store/*-definitions.d.ts` or `frontend/src/features/*/types.ts`

Create TypeScript interfaces for your dataset records.

**Example:**
```typescript
// frontend/src/features/my-feature/types.ts
export interface MyDataRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
}
```

### 2. Update Core Types

**File:** `frontend/src/types/types.ts`

Add your dataset to the core type system:

```typescript
// 1. Import your data type
import { MyDataRecord } from "@/features/my-feature/types";

// 2. Add to DatasetId union type
export type DatasetId =
  | "existing_dataset"
  // ... other datasets
  | "my_new_dataset";  // Add this line

// 3. Add to DATASET_REFERENCES object
export const DATASET_REFERENCES = {
  // ... existing references
  MY_NEW_DATASET: { dataset: "my_new_dataset" as DatasetId, field: "id" },
} as const;

// 4. Add to DatasetTypeMap
export type DatasetTypeMap = {
  // ... existing mappings
  my_new_dataset: MyDataRecord;
};
```

### 3. Create Field Definitions

**File:** `frontend/src/features/field-definitions/*-definitions.ts`

Create or update the relevant definitions file:

```typescript
// frontend/src/features/field-definitions/my-feature-definitions.ts
import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const MY_NEW_DATASET_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "my_new_dataset",
  name: "My New Dataset",
  description: "Description of what this dataset stores",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the record",
      isSearchable: true,
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Optional description",
      isSearchable: false,
      isOptional: true,
    },
    // Add more fields as needed
    
    // Example relation field:
    createRelationField(
      "related_record_id",
      "Related Record",
      DATASET_REFERENCES.SOME_OTHER_DATASET,
      {
        description: "Reference to another dataset",
        deleteBehavior: "preventDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        isSearchable: true,
        isOptional: true,
      }
    ),
  ],
};
```

### 4. Update Field Definitions Store

**File:** `frontend/src/features/field-definitions/field-definitions-store.ts`

```typescript
// 1. Import your new definition
import {
  // ... existing imports
  MY_NEW_DATASET_FIELD_DEFINITIONS,
} from "./my-feature-definitions";

// 2. Add to ALL_DEFINITIONS array
const ALL_DEFINITIONS = [
  // ... existing definitions
  MY_NEW_DATASET_FIELD_DEFINITIONS,
];
```

### 5. Update Settings Store

**File:** `frontend/src/store/settings-store.ts`

```typescript
// Add to defaultDatasets object
const defaultDatasets = {
  // ... existing datasets
  my_new_dataset: true,
};

// If the dataset has a dedicated route, also add to defaultRoutes
const defaultRoutes = {
  // ... existing routes
  "/my-feature": true,  // If you have a dedicated route
};

// If the dataset has a dashboard summary, add to defaultDashboardSummaries
const defaultDashboardSummaries = {
  // ... existing summaries
  "/my-feature": { id: "/my-feature", size: 'medium' as const, order: 9, visible: true },
};
```

### 6. Update Dashboard Route Mapping (Optional)

**File:** `frontend/src/routes/index.tsx`

If your dataset should map to a specific route in the dashboard summaries:

```typescript
// Update getDatasetRoute function
const getDatasetRoute = (datasetId: string): string => {
  // ... existing mappings
  if (datasetId === "my_new_dataset") {
    return "/my-feature";
  }
  return "/dataset";
};

// Update getOrderedDashboardSummaries function
const getOrderedDashboardSummaries = () => {
  const dashboardRoutes = [
    // ... existing routes
    "/my-feature",  // Add your route here
  ];
  // ... rest of function
};
```

### 7. Create Dashboard Summary Component (Optional)

**File:** `frontend/src/features/dashboard/my-feature-dashboard-summary.tsx`

If you want a custom dashboard summary widget:

```typescript
import React from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import ReusableCard from "@/components/reusable/reusable-card";
import { MyIcon } from "lucide-react";

interface MyFeatureDashboardSummaryProps {
  showPrivateMetrics?: boolean;
}

export default function MyFeatureDashboardSummary({
  showPrivateMetrics = true,
}: MyFeatureDashboardSummaryProps) {
  const myData = useStore(dataStore, (state) => state.my_new_dataset || []);

  // Filter private data if needed
  const filteredData = showPrivateMetrics 
    ? myData 
    : myData.filter(item => !item.private);

  const count = filteredData.length;
  const lastRecord = filteredData[0];

  return (
    <ReusableCard
      title="My Feature"
      icon={<MyIcon className="h-5 w-5" />}
      content={
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{count}</span>
            <span className="text-sm text-muted-foreground">records</span>
          </div>
          {lastRecord && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(lastRecord.lastModified).toLocaleDateString()}
            </p>
          )}
        </div>
      }
      href="/my-feature"
    />
  );
}
```

### 8. Update Dashboard Index (Optional)

**File:** `frontend/src/routes/index.tsx`

If you created a dashboard summary component:

```typescript
// 1. Import your component
import MyFeatureDashboardSummary from "@/features/dashboard/my-feature-dashboard-summary";

// 2. Add to the renderSummary switch statement
const renderSummary = () => {
  switch (route) {
    // ... existing cases
    case "/my-feature":
      return <MyFeatureDashboardSummary showPrivateMetrics={isUnlocked && showPrivateMetrics} />;
    default:
      return null;
  }
};
```

## Automatic Updates

The following files automatically pick up your new dataset once the above steps are complete:

- **Data Store** (`frontend/src/store/data-store.ts`) - Automatically includes all datasets from field definitions
- **Loading Store** (`frontend/src/store/loading-store.ts`) - Automatically creates loading states for all datasets
- **Generic Data Table** - Will automatically work with your dataset
- **Generic Data Form** - Will automatically generate forms based on your field definitions
- **Dataset Route** (`/dataset`) - Will automatically include your dataset in the dropdown

## Verification Checklist

After completing the integration, verify:

- [ ] Dataset appears in `/dataset` route dropdown
- [ ] Dataset summary appears in dashboard (if enabled)
- [ ] Dataset summary is clickable and navigates correctly
- [ ] Data table loads and displays records
- [ ] Add/Edit forms work correctly
- [ ] Relations to other datasets work (if applicable)
- [ ] Private data filtering works (if applicable)
- [ ] TypeScript compilation succeeds without errors

## Common Patterns

### For Simple Datasets
- Basic field definitions with text, number, date, boolean fields
- Enable in settings store
- No custom dashboard component needed

### For Feature-Specific Datasets
- Complex field definitions with relations
- Custom dashboard summary component
- Dedicated route mapping
- Custom types in feature directory

### For Supporting Datasets
- Simple field definitions
- Enable in settings but hidden from dashboard
- Used primarily as relation targets

## File Summary

Here's a complete list of files that may need updates when adding a new dataset:

### Required Files:
1. `frontend/src/features/field-definitions/*-definitions.ts` - Field definitions
2. `frontend/src/features/field-definitions/field-definitions-store.ts` - Add to store
3. `frontend/src/store/settings-store.ts` - Enable dataset
4. `frontend/src/types/types.ts` - Type definitions

### Optional Files (based on requirements):
5. `frontend/src/features/*/types.ts` - Custom data types
6. `frontend/src/routes/index.tsx` - Route mapping & dashboard integration
7. `frontend/src/features/dashboard/*-dashboard-summary.tsx` - Custom dashboard widget

### Automatically Updated Files:
- `frontend/src/store/data-store.ts` - Auto-includes all datasets
- `frontend/src/store/loading-store.ts` - Auto-creates loading states
- All generic components (tables, forms, etc.) - Work automatically

## Troubleshooting

### Dataset doesn't appear in dropdown
- Check if dataset is enabled in `settings-store.ts` `defaultDatasets`
- Verify field definitions are imported in `field-definitions-store.ts`

### TypeScript errors
- Ensure dataset ID is added to `DatasetId` type in `types.ts`
- Verify data type is added to `DatasetTypeMap` in `types.ts`

### Dashboard summary not working
- Check route mapping in `getDatasetRoute` function
- Verify dashboard summary component is imported and added to switch statement
- Ensure route is enabled in `settings-store.ts` `defaultRoutes`

### Relations not working
- Verify relation fields use `createRelationField` helper
- Check that related dataset references are correct
- Ensure related datasets are also properly defined
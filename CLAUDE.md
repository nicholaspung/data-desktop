# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Desktop is a Wails-based desktop application for personal data tracking and visualization. It consists of a Go backend with SQLite database and a React TypeScript frontend. The application allows users to track various types of personal metrics including DEXA scans, bloodwork, daily metrics, experiments, journaling, time tracking, and people CRM.

## Development Commands

### Primary Development
- **Development mode**: `wails dev -appargs dev` (uses DataDesktop-dev.db)
- **Build**: `wails build`
- **Frontend only**: `cd frontend && npm run dev`
- **Frontend build**: `cd frontend && npm run build`
- **Frontend lint**: `cd frontend && npm run lint`

## Architecture

### Backend (Go)
- **Main entry**: `main.go` - Wails application setup with dev/prod database switching
- **API layer**: `backend/api.go` - Contains all frontend-callable methods
- **Database**: `backend/database/` - SQLite with dynamic schema and relationships
  - `models.go` - Core data structures (Dataset, DataRecord, FieldDefinition)
  - `dataset_definitions.go` - Predefined dataset configurations
  - `dataset_sync.go` - Syncs predefined datasets to database
  - `repository.go` - Database operations
- **File handling**: `backend/file/` - Manages file uploads and storage

### Frontend (React + TypeScript)
- **Router**: TanStack Router with file-based routing in `src/routes/`
- **State management**: TanStack Store in `src/store/`
- **Components**: Organized by feature in `src/components/`
  - `data-table/` - Generic data table with editing capabilities
  - `data-form/` - Dynamic form generation based on field definitions
  - `charts/` - Recharts-based visualization components
  - `resuable/` - Reusable components to be utilize whenever possible
  - Feature-specific components in respective directories
- **Utilities**: Common functions organized in `src/lib/`
- **UI**: Radix UI components with Tailwind CSS styling

### Key Architectural Patterns
- **Dynamic schema**: Datasets defined via JSON field definitions, stored as SQLite TEXT
- **Generic components**: Data tables and forms work with any dataset configuration
- **Relationship system**: Fields can reference other datasets with display field resolution
- **File handling**: Base64 files converted to local file paths, stored in app data directory
- **Security**: Optional PIN protection for private data viewing

### Database Strategy
- Development uses `DataDesktop-dev.db`, production uses `DataDesktop.db`
- Schema-less approach: field definitions stored as JSON, data stored as JSON in TEXT columns
- Relationships handled via JSON field references with runtime resolution

### Data Flow
1. Frontend forms submit JSON data to backend API methods
2. Backend processes files (base64 → local files) and validates relationships
3. Data stored as JSON in SQLite with metadata (id, timestamps, dataset_id)
4. Frontend fetches processed data with resolved relationships for display

## Creating New Routes with FeatureLayout

When creating new routes, use the standardized `FeatureLayout` and `FeatureHeader` components for consistency:

### Basic Structure
```tsx
import { FeatureLayout, FeatureHeader } from "@/components/layout/feature-layout";

function NewPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Feature Name"
          description="Brief description of what this feature does"
          storageKey="feature-name" // Used for localStorage keys
          helpText="Optional help text that appears in a collapsible info panel"
          helpVariant="info" // "info" | "tip" | "warning"
          developmentStage="alpha" // Optional: "alpha" | "beta" - shows warning panel
          guideContent={[ // Optional: creates a guide button
            {
              title: "Getting Started",
              content: "Step-by-step instructions..."
            }
          ]}
        >
          <FeatureIcon className="h-8 w-8" /> {/* Optional icon in header */}
        </FeatureHeader>
      }
      sidebar={<OptionalSidebar />} // Optional sidebar content
      sidebarPosition="right" // "left" | "right"
    >
      {/* Main content goes here */}
    </FeatureLayout>
  );
}
```

### Required Props
- `title`: Feature name displayed as main heading
- `storageKey`: Unique key for localStorage (use kebab-case)

### Optional Props
- `description`: Subtitle text below title
- `helpText`: Content for help info panel
- `helpVariant`: Style of help panel ("info", "tip", "warning")
- `developmentStage`: Shows alpha/beta warning ("alpha", "beta")
- `guideContent`: Array of guide sections with title/content
- `children`: Icon or other elements next to title
- `sidebar`: Right/left sidebar content
- `sidebarPosition`: Sidebar placement

### Example Implementation
See `/frontend/src/routes/wealth.tsx` for a complete example.

## Component Development Guidelines

When creating new components in the frontend:

### Reusable Component Priority
- **Always check first**: Browse `frontend/src/components/reusable/` for existing components before creating new ones
- **Available reusable components include**:
  - Form controls: `autocomplete-input.tsx`, `reusable-select.tsx`, `reusable-multiselect.tsx`, `reusable-date-picker.tsx`, `tag-input.tsx`
  - Dialogs: `reusable-dialog.tsx`, `confirm-delete-dialog.tsx`, `confirm-changes-dialog.tsx`, `triple-confirm-dialog.tsx`
  - Layout: `reusable-card.tsx`, `reusable-collapsible.tsx`, `reusable-tabs.tsx`, `reusable-summary.tsx`
  - Data handling: `data-table/`, `data-form/`, `dynamic-field-renderer.tsx`, `field-value-display.tsx`
  - File management: `file-upload.tsx`, `multiple-file-upload.tsx`, `file-viewer.tsx`
  - UI utilities: `loading.tsx`, `reusable-tooltip.tsx`, `info-panel.tsx`, `error-boundary.tsx`

### Utility Function Priority
- **Always check first**: Browse `frontend/src/lib/` for existing utility functions before implementing new ones
- **Available utility libraries include**:
  - Data processing: `data-utils.ts`, `csv-parser.ts`, `csv-export.ts`, `edit-utils.ts`, `form-utils.ts`
  - Date/time: `date-utils.ts`, `time-utils.ts`, `time-entry-utils.ts`
  - Tables: `table-utils.tsx`, `table-filter-utils.ts`, `table-width-utils.ts`
  - Relations: `relation-utils.ts`
  - General: `utils.ts`, `crypto-utils.ts`

### Development Approach
1. **Research existing solutions**: Always explore reusable components and utilities first
2. **Extend existing components**: Prefer extending/enhancing existing components over creating new ones
3. **Extract reusable patterns**: If creating new functionality, consider if it should be added to the reusable collection
4. **Follow established patterns**: Use the same naming conventions and structure as existing components

## Adding New Datasets and Features

When adding new datasets or features that involve data storage:

### Backend Dataset Creation
- **Follow the guide**: `backend/database/ADDING_DATASETS.md`
- **Required steps**:
  1. Add dataset ID constant to `backend/database/constants.go`
  2. Add field definitions to `backend/database/dataset_definitions.go`
  3. Add dataset to cleanup function in `backend/database/cleanup_unused_tables.go`

### Frontend Dataset Integration
- **Follow the guide**: `FRONTEND_DATASET_GUIDE.md`
- **Required steps**:
  1. Create TypeScript type definitions
  2. Update core types in `frontend/src/types/types.ts`
  3. Create field definitions in `frontend/src/features/field-definitions/`
  4. Update field definitions store
  5. Enable in settings store
  6. Optional: Add route, dashboard summary, and navigation

### Important Notes
- Always create backend datasets first, then integrate frontend
- Both guides provide comprehensive step-by-step instructions
- The system automatically handles data store updates and generic component integration
- Follow the existing patterns and naming conventions

## Important Notes

- Always use `wails dev -appargs dev` for development to avoid using production database
- The application stores all data locally - no external services required
- File uploads are converted from base64 and stored in the app data directory
- Private data is protected by PIN but not encrypted in the database
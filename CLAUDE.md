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

## Important Notes

- Always use `wails dev -appargs dev` for development to avoid using production database
- The application stores all data locally - no external services required
- File uploads are converted from base64 and stored in the app data directory
- Private data is protected by PIN but not encrypted in the database
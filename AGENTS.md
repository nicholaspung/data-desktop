# AGENTS.md - Development Guidelines for Data Desktop

## Build/Lint/Test Commands
- **Development**: `wails dev -appargs dev` (uses dev database)
- **Build**: `wails build` (full app) or `cd frontend && npm run build` (frontend only)
- **Lint**: `cd frontend && npm run lint`
- **Frontend dev**: `cd frontend && npm run dev`
- **No test framework configured** - verify changes by building and manual testing

## Code Style Guidelines

### TypeScript/React Frontend
- **Imports**: Use `@/` path alias for src imports, group by external/internal/relative
- **Components**: Use default exports, PascalCase filenames, destructured props with types
- **Types**: Define interfaces/types in separate files, use strict TypeScript
- **Naming**: camelCase variables/functions, PascalCase components/types, kebab-case files
- **Error handling**: Use try/catch blocks, display user-friendly error messages
- **Styling**: Tailwind CSS with `cn()` utility for conditional classes

### Go Backend  
- **Naming**: PascalCase exports, camelCase private, snake_case constants
- **Error handling**: Return errors explicitly, log appropriately
- **Imports**: Standard library first, then external, then internal packages

## Key Patterns
- Always check `frontend/src/components/reusable/` before creating new components
- Use `FeatureLayout` and `FeatureHeader` for new routes
- Follow existing dataset patterns in `backend/database/` and `frontend/src/features/`
- All dates stored as UTC, displayed in local timezone using `date-fns`
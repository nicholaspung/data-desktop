# Daily Journal Template System Proposal

## Overview

This document outlines a proposal for implementing a template system in the Daily Journal feature that enables structured data collection and analysis without requiring Large Language Models (LLMs). The goal is to allow users to insert templates into their journal entries that can be parsed and analyzed programmatically, while maintaining the natural flow of journaling.

## Current State

The Daily Journal currently supports:
- Free-form text entry with markdown support
- `@metric:` syntax for automatic metric logging
- `@todo:` syntax for marking todos as complete
- Automatic extraction and logging of metrics from journal text

## Motivation

Users may want to track structured data within their journal entries for:
- Consistent health check-ins
- Workout logging
- Mood tracking
- Daily reflections
- Goal progress
- Any repeated data patterns

While LLMs could extract this data from unstructured text, a template system provides:
- Immediate, reliable data extraction
- No dependency on external services
- Consistent data structure for analysis
- User control over what data is tracked

## Proposed Template Approaches

### 1. Structured Block Templates (Recommended)

Extend the existing `@metric:` and `@todo:` pattern with `@template:` blocks.

**Example:**
```
Today was productive!

@template:workout
type: strength
duration: 45
exercises: squats, deadlifts, bench
feeling: energized
notes: increased weight on squats

Had a great workout session...

@template:mood_checkin
mood: 8/10
energy: high
stress: low
sleep_quality: good
```

**Pros:**
- Builds on existing pattern users already understand
- Maintains flexibility while adding structure
- Easy to parse and analyze programmatically
- Can coexist with free-form text
- Clear visual separation of structured data

**Cons:**
- Requires users to learn template syntax
- May feel less natural than pure journaling
- Could interrupt writing flow

### 2. Section-Based Templates

Use markdown-style headers to define template sections with predictable fields.

**Example:**
```
## Morning Routine
Wake time: 6:30 AM
Morning mood: Good
Breakfast: Oatmeal with berries

## Work Summary
Focus hours: 4
Key tasks: [x] Project review [ ] Email cleanup
Distractions: Low
```

**Pros:**
- More natural reading/writing experience
- Compatible with markdown preview
- Easy to visually scan
- Feels like normal note-taking

**Cons:**
- Harder to parse reliably
- May conflict with user's natural writing style
- Less explicit about what's being tracked
- Ambiguous field boundaries

### 3. Inline Field Templates

Define templates as collections of inline fields that can be inserted anywhere.

**Example:**
```
Woke up at {wake_time: 6:30} feeling {mood: refreshed}. 
Had {breakfast: oatmeal} and went for a {exercise: 30min run}.
```

**Pros:**
- Most flexible approach
- Minimal disruption to writing flow
- Can be analyzed using regex patterns
- Natural language feel

**Cons:**
- May be missed in analysis if not properly formatted
- Less structured than other approaches
- Harder to validate field completeness
- Complex parsing requirements

### 4. Hybrid Smart Templates

Combine natural language with structured data extraction hints.

**Example:**
```
@template:health_checkin
Today I'm feeling pretty good overall. My energy is high (energy: 8/10) 
and I slept well last night (sleep_hours: 7.5). No symptoms to report 
(symptoms: none).
```

**Pros:**
- Best of both worlds
- Future-compatible with LLM enhancement
- Flexible parsing options
- Natural writing preserved

**Cons:**
- More complex to implement
- May require iterative refinement
- Unclear boundaries between structured and unstructured data

## Recommended Implementation Plan

### Phase 1: Backend Template Support

1. **Create Template Definition Storage**
   ```sql
   CREATE TABLE template_definitions (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     fields TEXT NOT NULL, -- JSON array of field definitions
     category TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

2. **Create Template Data Storage**
   ```sql
   CREATE TABLE template_data (
     id TEXT PRIMARY KEY,
     journal_entry_id TEXT NOT NULL,
     template_id TEXT NOT NULL,
     data TEXT NOT NULL, -- JSON object with field values
     date TIMESTAMP NOT NULL,
     created_at TIMESTAMP,
     FOREIGN KEY (journal_entry_id) REFERENCES daily_journal(id),
     FOREIGN KEY (template_id) REFERENCES template_definitions(id)
   );
   ```

3. **Extend Journal Processing**
   - Modify `SaveDailyJournalWithMetrics` to extract `@template:` blocks
   - Parse template syntax (YAML-like format recommended)
   - Validate against template definitions
   - Store extracted data in template_data table

4. **API Endpoints**
   - `GetTemplateDefinitions()` - List all templates
   - `CreateTemplateDefinition(data)` - Create new template
   - `UpdateTemplateDefinition(id, data)` - Update template
   - `DeleteTemplateDefinition(id)` - Delete template
   - `GetTemplateData(filters)` - Query template data

### Phase 2: Frontend Template Integration

1. **Template Management UI**
   - Settings page section for template management
   - List view with create/edit/delete functionality
   - Template builder with field type selection:
     - Text (single line)
     - Text area (multi-line)
     - Number
     - Boolean (yes/no)
     - Select (predefined options)
     - Date/Time
     - Scale (1-10)

2. **Journal Editor Enhancement**
   - Add `@template:` to autocomplete system
   - Show available templates when typing `@template:`
   - Inline template form that appears when template selected
   - Visual indicators for template blocks (colored border)
   - Template validation and error handling

3. **Preview Enhancement**
   - Format template data as structured cards
   - Collapsible template sections
   - Highlight template data differently from regular text

### Phase 3: Data Analysis Features

1. **Template Data Dashboard**
   - New route: `/daily-journal/analysis`
   - Filter by template type and date range
   - Aggregation options (daily, weekly, monthly)
   - Trend visualization for numeric fields
   - Comparison views

2. **Export Functionality**
   - Export template data as CSV
   - Export as JSON for further processing
   - Include both structured and journal text

3. **Search Enhancement**
   - Add template field search to journal history
   - Filter entries by template presence
   - Search within specific template fields

### Phase 4: Pre-built Template Library

1. **Health & Wellness**
   - Mood Check-in (mood, energy, stress, anxiety)
   - Sleep Log (hours, quality, dreams)
   - Symptom Tracker (symptom, severity, triggers)
   - Medication Log (medication, time, dose)

2. **Fitness & Activity**
   - Workout Log (type, duration, exercises, intensity)
   - Running Log (distance, time, pace, route)
   - Nutrition Check-in (meals, water, supplements)

3. **Productivity**
   - Daily Reflection (gratitude, accomplishment, challenge)
   - Goal Progress (goal, progress percentage, blockers)
   - Work Summary (focus hours, tasks, interruptions)

4. **Personal**
   - Habit Tracker (habit, completed, notes)
   - Learning Log (topic, time spent, key insights)
   - Social Interaction (person, activity, quality)

## Technical Considerations

### Template Syntax

Recommended YAML-like syntax for clarity and simplicity:
```
@template:template_name
field1: value1
field2: value2
field3: multi-line value
  can span multiple lines
  with proper indentation
```

### Field Types and Validation

```typescript
interface TemplateField {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'scale';
  required: boolean;
  options?: string[]; // for select type
  min?: number; // for number/scale types
  max?: number; // for number/scale types
  default?: any;
  description?: string;
}
```

### Data Structure Example

```typescript
interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  is_active: boolean;
}

interface TemplateData {
  id: string;
  journal_entry_id: string;
  template_id: string;
  date: Date;
  data: Record<string, any>;
}
```

### Parsing Strategy

1. Use regex to find `@template:name` blocks
2. Extract indented lines following the template declaration
3. Parse YAML-like syntax into key-value pairs
4. Validate against template definition
5. Store both raw and parsed data

### Backward Compatibility

- Maintain full compatibility with existing `@metric:` system
- Templates can include metric fields that auto-create metric entries
- Existing journal entries remain unchanged
- Progressive enhancement approach

## Future Enhancements

### LLM Integration (Optional)
- Use templates as training data for pattern recognition
- Auto-suggest template usage based on journal content
- Extract template-like data from historical entries
- Natural language to template conversion

### Advanced Features
- Template versioning
- Conditional fields
- Calculated fields
- Template inheritance
- Custom validation rules
- API integration for external data

### Mobile Optimization
- Quick template buttons
- Voice-to-template conversion
- Template shortcuts
- Gesture-based template insertion

## Benefits

1. **Structured Data Collection**: Consistent data format for analysis
2. **User Control**: Users decide what to track and how
3. **Flexibility**: Mix structured and unstructured content
4. **Privacy**: All processing happens locally
5. **Extensibility**: Easy to add new template types
6. **Export Ready**: Structured data perfect for external analysis

## Risks and Mitigation

1. **Complexity**: Keep initial implementation simple, add features gradually
2. **User Adoption**: Provide clear examples and pre-built templates
3. **Performance**: Index template data for fast queries
4. **Data Migration**: Design with future changes in mind

## Conclusion

The template system extends Daily Journal's capabilities while maintaining its simplicity and privacy-focused approach. By building on existing patterns (@metric:, @todo:), users can gradually adopt structured data collection without disrupting their journaling practice. The system is designed to work independently but can be enhanced with LLM capabilities in the future.
// src/routes/time-tracker.tsx
import { createFileRoute } from "@tanstack/react-router";
import TimeTracker from "@/features/time-tracker/time-tracker";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";

export const Route = createFileRoute("/time-tracker")({
  component: TimeTrackerPage,
});

// Define the guide content sections
const timeTrackerGuideContent = [
  {
    title: "Getting Started",
    content: `
## Time Tracker Overview

The Time Tracker helps you monitor how you spend your time throughout the day. Key features include:

- Track time in real-time with the timer functionality
- Manually add time entries for past activities
- Organize entries with categories and tags
- View detailed analytics and reports
- Identify time-consuming activities
- Track overlapping time entries
    `,
  },
  {
    title: "Tracking Methods",
    content: `
## Two Ways to Track Time

1. **Timer Mode**: 
   - Start the timer when you begin an activity
   - The system records the duration automatically
   - Stop and save when you're finished
   - Perfect for real-time tracking

2. **Manual Entry**:
   - Add time entries after they've occurred
   - Specify exact start and end times
   - Useful for recording past activities
   - Great for filling gaps in your time tracking
    `,
  },
  {
    title: "Categories & Tags",
    content: `
## Organizing Your Time Entries

**Categories**:
- Create categories for major areas of your life (Work, Personal, Exercise, etc.)
- Assign a color to each category for visual distinction
- Use categories for high-level time analysis

**Tags**:
- Add comma-separated tags to entries for more detailed classification
- Tags are flexible and can evolve over time
- Filter and analyze time by specific tags
- Example tags: meeting, coding, writing, reading, planning
    `,
  },
  {
    title: "Reports & Analysis",
    content: `
## Understanding Your Time Usage

The Time Tracker provides several views to understand how you spend your time:

- **Summary**: Get a high-level overview with charts and statistics
- **Calendar**: See your day or week visually with a time-based calendar
- **List**: View all entries chronologically with filtering options
- **Categories**: Manage your time categories

These reports help identify patterns, track productivity, and make informed decisions about your time usage.
    `,
  },
];

function TimeTrackerPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Time Tracker"
          description="Track and analyze how you spend your time"
          guideContent={timeTrackerGuideContent}
          storageKey="time-tracker-page"
        />
      }
      sidebar={
        <HelpSidebar title="About Time Tracking">
          <CompactInfoPanel title="How to Use Time Tracker" variant="info">
            <ol>
              <li>1. Create categories to organize your time entries</li>
              <li>
                2. Use the timer to track activities in real-time or add entries
                manually
              </li>
              <li>3. Add tags to further classify your time entries</li>
              <li>
                4. Review the summary reports to understand your time usage
              </li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel title="Best Practices" variant="tip">
            <ul>
              <li>- Create meaningful categories with distinct colors</li>
              <li>- Use consistent tags for better filtering</li>
              <li>- Track all significant time periods for accurate reports</li>
              <li>- Review your time usage patterns weekly</li>
              <li>- Use the description field to include specific details</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel title="Quick Tips" variant="tip">
            <ul>
              <li>- Use the "Now" button to quickly set current time</li>
              <li>- The "Last" button continues from your previous entry</li>
              <li>
                - The header timer allows tracking from anywhere in the app
              </li>
              <li>
                - Previous entries and time metrics appear in autocomplete
              </li>
              <li>- Check for overlapping entries in the list view</li>
            </ul>
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <TimeTracker />
    </FeatureLayout>
  );
}

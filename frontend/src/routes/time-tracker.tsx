import { createFileRoute } from "@tanstack/react-router";
import TimeTracker from "@/features/time-tracker/time-tracker";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import PomodoroNotification from "@/features/time-tracker/pomodoro-notification";
import TimeEntryConflictResolver from "@/features/time-tracker/time-entry-conflict-resolver";
import { useMemo, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import settingsStore, { isMetricsEnabled } from "@/store/settings-store";
import { findOverlappingEntries } from "@/lib/time-entry-utils";
import { Button } from "@/components/ui/button";
import { FEATURE_ICONS } from "@/lib/icons";

export const Route = createFileRoute("/time-tracker")({
  component: TimeTrackerPage,
});

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
  const [showConflictChecker, setShowConflictChecker] = useState(false);
  const timeEntries = useStore(dataStore, (state) => state.time_entries);
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);
  const metricsEnabled = isMetricsEnabled(visibleRoutes);

  const overlappingEntries = useMemo(() => {
    return findOverlappingEntries(timeEntries);
  }, [timeEntries]);

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Time Tracker"
          description="Track and analyze how you spend your time"
          guideContent={timeTrackerGuideContent}
          storageKey="time-tracker-page"
        >
          {overlappingEntries.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowConflictChecker(true)}
              className="gap-2 border-amber-400 text-amber-600 hover:bg-amber-50"
            >
              <FEATURE_ICONS.ALERT_TRIANGLE className="h-4 w-4" />
              Resolve {overlappingEntries.length} Time Conflicts
            </Button>
          )}
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="About Time Tracking">
          <CompactInfoPanel
            title="How to Use Time Tracker"
            variant="info"
            storageKey="time-tracker-how-to-use"
          >
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

          <CompactInfoPanel
            title="Best Practices"
            variant="tip"
            storageKey="time-tracker-best-practices"
          >
            <ul>
              <li>- Create meaningful categories with distinct colors</li>
              <li>- Use consistent tags for better filtering</li>
              <li>- Track all significant time periods for accurate reports</li>
              <li>- Review your time usage patterns weekly</li>
              <li>- Use the description field to include specific details</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Quick Tips"
            variant="tip"
            storageKey="time-tracker-quick-tips"
          >
            <ul>
              <li>- Use the "Now" button to quickly set current time</li>
              <li>- The "Last" button continues from your previous entry</li>
              <li>
                - The header timer allows tracking from anywhere in the app
              </li>
              <li>
                - Previous entries{metricsEnabled ? " and time metrics" : ""} appear in autocomplete
              </li>
              <li>- Check for overlapping entries in the list view</li>
            </ul>
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <TimeTracker />
      <PomodoroNotification />
      <TimeEntryConflictResolver
        onDataChange={() => {}}
        open={showConflictChecker}
        onOpenChange={setShowConflictChecker}
      />
    </FeatureLayout>
  );
}

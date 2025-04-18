import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import AddCategoryDialog from "@/features/daily-tracker/add-category-dialog";
import AddMetricModal from "@/features/daily-tracker/add-metric-modal";
import DailyTrackerCalendarView from "@/features/daily-tracker/daily-tracker-calendar-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

// Define the guide content sections
const dailyTrackerGuideContent = [
  {
    title: "What is Daily Tracking?",
    content: `
## Track Your Metrics and Habits

This feature allows you to track metrics you want to improve, either because you want to develop a daily habit, or if you have a metric attached to an experiment you are conducting.

The calendar view shows your tracked metrics along with:
- Progress for each date
- Experiment associations and progress
- Completion status with visual indicators
- Streak tracking for consistency

Whether you're building habits or conducting experiments, this view gives you the complete picture of your progress.
    `,
  },
  {
    title: "Getting Started",
    content: `
## Setting Up Your Tracking System

To get the most out of the Daily Tracker:

1. **Create categories first** - Start by creating logical categories to organize your metrics
2. **Add your metrics** - Create metrics and customize them to fit your specific needs:
   - Choose the appropriate metric type (boolean, number, percentage, time)
   - Set your target values
   - Configure repetition schedule (daily, weekly, custom)
   - Assign to the appropriate category

Once you've created your metrics, you're ready to start tracking directly from the calendar view!
    `,
  },
  {
    title: "Custom Schedules",
    content: `
## Customizing When Metrics Appear

You can configure precisely when each metric appears:

### Scheduling Options
- **Daily**: Track every day
- **Weekly**: Select specific days of the week (e.g., Mon/Wed/Fri)
- **Custom**: Create custom repetition patterns

### Additional Options
- Set start and end dates for time-limited tracking
- Mark metrics as active or inactive
- Associate metrics with specific experiments

The calendar will automatically show the appropriate metrics for each day based on your configuration.
    `,
  },
  {
    title: "Daily Tracking",
    content: `
## Recording Your Progress

Recording your progress is simple:

1. Click on any day in the calendar
2. Enter values for each metric scheduled for that day
3. Add optional notes for context
4. See immediate visual feedback on completion status

You can also:
- View and update previous days
- See your current streaks
- Filter metrics by category or experiment
- Use quick actions for faster logging
    `,
  },
  {
    title: "Experiment Integration",
    content: `
## Connect Metrics to Experiments

For more structured self-experimentation:

1. Create an experiment in the Experiments section
2. Add metrics to track for this experiment
3. Set target values and importance levels
4. The calendar will automatically show experiment progress

This integration helps you evaluate the success of your experiments with objective data tracked consistently over time.
    `,
  },
];

function RouteComponent() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Daily Tracking"
          description="Track your habits, goals, and experiment metrics in one place"
          guideContent={dailyTrackerGuideContent}
          storageKey="calendar-page"
        >
          <AddMetricModal buttonLabel="Add Metric" />
          <AddCategoryDialog />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="Quick Tips">
          <CompactInfoPanel title="Getting Started" variant="tip">
            <ol>
              <li>1. Create categories for your metrics</li>
              <li>2. Add metrics and customize their options</li>
              <li>3. Configure schedule settings (daily, weekly, etc.)</li>
              <li>4. Use the calendar to log your daily progress</li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel title="Best Practices" variant="info">
            <ul>
              <li>- Group related metrics with categories</li>
              <li>- Start with just a few metrics to build consistency</li>
              <li>- Log data at consistent times each day</li>
              <li>- Use the notes field to capture context</li>
              <li>- Review weekly to identify patterns</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel title="Privacy Note" variant="info">
            All tracking data is stored locally on your device and never
            transmitted to any server.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <DailyTrackerCalendarView />
    </FeatureLayout>
  );
}

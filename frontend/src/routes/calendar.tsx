import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import AddMetricModal from "@/features/daily-tracker/add-metric-modal";
import DailyTrackerCalendarView from "@/features/daily-tracker/daily-tracker-calendar-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

// Define the guide content sections
const dailyTrackerGuideContent = [
  {
    title: "Getting Started",
    content: `
## Daily Tracker Calendar View

The Daily Tracker Calendar View helps you monitor your metrics and goals on a daily basis. This view provides:

- A calendar interface to log daily progress
- Visual indicators of completion status
- Quick access to add new entries
- Filters for different metric categories and experiments

Use this feature to build consistent habits, track progress toward goals, and gather data for your experiments.
    `,
  },
  {
    title: "Adding Metrics",
    content: `
## Adding New Metrics to Track

To add a new metric to your daily tracker:

1. Click the **+ Add Metric** button in the toolbar
2. Enter a name and description for your metric
3. Select the appropriate **type**:
   - **Boolean**: Yes/no completion (e.g., "Did you meditate?")
   - **Number**: Numeric values (e.g., "Steps walked")
   - **Time**: Duration tracking (e.g., "Minutes exercised")
   - **Percentage**: Portion completed (e.g., "Daily water goal")
4. Set a default value
5. Choose additional options like unit (for numeric metrics)
6. Click **Save** to create your new metric

Your new metric will be available immediately for tracking in the calendar.
    `,
  },
  {
    title: "Display Configuration",
    content: `
## Configuring When Metrics Appear

You can customize when and how metrics appear in your calendar:

### Scheduling Options

Configure a metric to appear automatically on specific days:

1. In the metric settings, go to the **Schedule** section
2. Choose from scheduling options:
   - **Daily**: Show every day
   - **Weekly**: Select specific days of the week
   - **Custom**: Create a custom repeating pattern

### Date Range Limitations

You can also limit when a metric appears:

1. Set a **Start Date** to begin showing the metric
2. Optionally set an **End Date** to stop showing the metric
3. Use this for seasonal goals or temporary tracking needs

### Manual Tracking

If you prefer to manually track a metric:

1. Disable automatic scheduling by selecting "Manual" in the schedule dropdown
2. The metric will only appear when you specifically add it to a day
3. Use the search function in the calendar to find and add manual metrics
    `,
  },
  {
    title: "Categorizing Metrics",
    content: `
## Organizing with Categories

Categories help you organize related metrics:

### Creating Categories

1. Go to the **Categories** section in the settings
2. Click **+ Add Category**
3. Enter a name and optionally choose a color
4. Click **Save**

### Assigning Metrics to Categories

1. When creating or editing a metric, select a category from the dropdown
2. You can change a metric's category at any time
3. A metric can only belong to one category

### Filtering by Category

In the calendar view:

1. Use the category filter dropdown to focus on specific categories
2. Select "All Categories" to view everything
3. The category color will appear as an indicator on each metric in the calendar
    `,
  },
  {
    title: "Experiment Integration",
    content: `
## Connecting Metrics to Experiments

Link your daily tracking to experiments for more meaningful data analysis:

### Adding Metrics to Experiments

1. First, create an experiment in the Experiments section
2. Then, in the experiment detail page:
   - Click the **Add Metric** button
   - Select from your existing metrics or create a new one
   - Set target goals for this metric in the experiment
   - Assign an importance level (1-10)

### Tracking Experiment Metrics

When a metric is part of an experiment:

1. It will be highlighted in the calendar view with the experiment name
2. Completion status will be evaluated against the experiment's targets
3. The experiment dashboard will automatically show your tracking data

### Multiple Experiments

A single metric can be part of multiple experiments:

1. Add the same metric to different experiments with different targets
2. The calendar will show all associated experiments
3. Each experiment will track the same data but evaluate it against its own targets
    `,
  },
  {
    title: "Daily Logging",
    content: `
## Recording Your Daily Progress

There are several ways to log your daily metrics:

### From the Calendar View

1. Click on a day in the calendar
2. All scheduled metrics will appear
3. Enter values or toggle completion status
4. Add notes if needed
5. Your entries are saved automatically

### Quick Actions

Use quick actions for efficient logging:

1. Hover over a metric to see quick action buttons
2. Use the check button to mark boolean metrics complete
3. Use +/- buttons to increment numeric metrics
4. Click the clock icon for time metrics to start/stop timers

### Batch Editing

For entering multiple days at once:

1. Click the **Batch Edit** button
2. Select a date range
3. Choose the metrics to edit
4. Enter values to apply across all selected days
5. Click **Save** to update all entries at once
    `,
  },
  {
    title: "Data Visualization",
    content: `
## Understanding Your Progress

The calendar provides visual indicators of your progress:

### Calendar Indicators

- **Green**: Goal completed or target reached
- **Yellow**: Partially completed or in progress
- **Red**: Not completed or below target
- **Gray**: Not tracked for that day

### Streak Tracking

The system automatically tracks consecutive completion:

1. Current streak is displayed next to each metric
2. Click on the streak number to see a history chart
3. The system detects breaks in your streak based on your scheduled days

### Summary Statistics

At the bottom of the calendar view:

1. **Completion Rate**: Percentage of days with goals met
2. **Average Values**: For numeric metrics
3. **Total Time**: Cumulative time for duration metrics
4. **Trends**: Direction of progress over the selected period
    `,
  },
];

function RouteComponent() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Daily Tracking"
          description="Track and view your metrics over time"
          guideContent={dailyTrackerGuideContent}
          storageKey="calendar-page"
        >
          <AddMetricModal buttonLabel="Add Metric" onMetricAdded={() => {}} />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="Tips & Information">
          <CompactInfoPanel title="Quick Start" variant="tip">
            <ol>
              <li>1. Add metrics you want to track</li>
              <li>2. Set their schedule (daily, weekly, etc.)</li>
              <li>3. Use the calendar to log your progress</li>
              <li>4. Review patterns in the insights view</li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel title="Pro Tips" variant="info">
            <ul>
              <li>- Use categories to organize related metrics</li>
              <li>- Connect important metrics to experiments</li>
              <li>- Set reminders to log your data consistently</li>
              <li>- Review weekly to identify patterns</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel title="Data Privacy" variant="info">
            All tracking data is stored locally on your device and is never sent
            to any server.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <DailyTrackerCalendarView />
    </FeatureLayout>
  );
  return;
}

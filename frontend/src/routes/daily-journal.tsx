import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import DailyJournalMainView from "@/features/daily-journal/daily-journal-main-view";
import { useStore } from "@tanstack/react-store";
import settingsStore from "@/store/settings-store";

export const Route = createFileRoute("/daily-journal")({
  component: DailyJournalPage,
});

function DailyJournalPage() {
  const settings = useStore(settingsStore);
  const isMetricsEnabled = settings.visibleRoutes["/metric"] === true;
  const isTodosEnabled = settings.visibleRoutes["/todos"] === true;

  const getHelpText = () => {
    let helpText = "The Daily Journal allows you to write daily entries";

    if (isMetricsEnabled) {
      helpText +=
        " and automatically extract metrics from your text. Use special syntax like 'weight: 150lbs' or 'mood: 8/10' to automatically log metrics.";
    }

    if (isTodosEnabled) {
      helpText +=
        " Use '@todo:TodoName:true' to mark todos complete or '@todo:New Todo Name:false' to create new todos. The system automatically selects the right quote style based on content.";
    }

    return helpText + ".";
  };

  const getGuideContent = () => {
    const content = [
      {
        title: "Getting Started",
        content: `Write your daily journal entries using natural language.${
          isMetricsEnabled
            ? `
              
**Automatic Metric Logging:**
- Use patterns like "weight: 150lbs" to log body measurements
- Use "mood: 8/10" or "mood: good" to track emotional states  
- Use "sleep: 7 hours" to track sleep duration
- Use "exercise: 30 mins running" to log activities
- Use "energy: high" or "energy: 7/10" to track energy levels`
            : ""
        }${
          isTodosEnabled
            ? `

**Todo Management:**
- Type "@todo:TodoName:true" to mark todos as complete
- Type "@todo:New Todo Name:false" to create new todos
- Use "@metric:MetricName:Value" to log metrics directly
- If you have multiple todos with the same name, all incomplete instances will be marked complete
- The autocomplete intelligently chooses quote style:
  - Names with apostrophes: '@todo:"Review week's goals":true'
  - Names with double quotes: "@todo:'Product "A" review':true"
  - Names with both: '@todo:\`Review "week\\'s" goals\`:true'
  - Names without spaces: "@todo:SimpleTask:true" (no quotes)`
            : ""
        }

${
  isMetricsEnabled || isTodosEnabled
    ? "The system will automatically detect these patterns and create metric entries or complete todos for you."
    : ""
}`,
      },
    ];

    if (isMetricsEnabled) {
      content.push({
        title: "Daily Summary",
        content: `View your daily summary to see:
- All journal entries for the day
- Metrics that were automatically logged
- Changes in measurements over time
- Daily progress tracking`,
      });
    }

    return content;
  };

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Daily Journal"
          description="Write daily entries with automatic metric extraction, todo management, and intelligent text processing"
          storageKey="daily-journal-page"
          helpText={getHelpText()}
          helpVariant="info"
          guideContent={getGuideContent()}
        />
      }
    >
      <DailyJournalMainView />
    </FeatureLayout>
  );
}

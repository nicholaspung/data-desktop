import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import { FEATURE_ICONS } from "@/lib/icons";
import DailyJournalMainView from "@/features/daily-journal/daily-journal-main-view";

export const Route = createFileRoute("/daily-journal")({
  component: DailyJournalPage,
});

function DailyJournalPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Daily Journal"
          description="Record your daily thoughts and automatically track metrics from your writing"
          storageKey="daily-journal-page"
          helpText="The Daily Journal allows you to write daily entries and automatically extract metrics from your text. Use special syntax like 'weight: 150lbs' or 'mood: 8/10' to automatically log metrics."
          helpVariant="info"
          developmentStage="alpha"
          guideContent={[
            {
              title: "Getting Started",
              content: `Write your daily journal entries using natural language. 
              
**Automatic Metric Logging:**
- Use patterns like "weight: 150lbs" to log body measurements
- Use "mood: 8/10" or "mood: good" to track emotional states  
- Use "sleep: 7 hours" to track sleep duration
- Use "exercise: 30 mins running" to log activities
- Use "energy: high" or "energy: 7/10" to track energy levels

The system will automatically detect these patterns and create metric entries for you.`,
            },
            {
              title: "Daily Summary",
              content: `View your daily summary to see:
- All journal entries for the day
- Metrics that were automatically logged
- Changes in measurements over time
- Daily progress tracking`,
            },
          ]}
        >
          <FEATURE_ICONS.BOOK_OPEN className="h-8 w-8" />
        </FeatureHeader>
      }
    >
      <DailyJournalMainView />
    </FeatureLayout>
  );
}
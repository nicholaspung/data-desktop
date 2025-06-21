import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { FEATURE_ICONS } from "@/lib/icons";
import GratitudeJournalView from "@/features/journaling/gratitude-journal-view";
import CreativityJournalView from "@/features/journaling/creativity-journal-view";
import QuestionJournalView from "@/features/journaling/question-journal-view";
import AffirmationView from "@/features/journaling/affirmation-view";
import JournalingMetricsSync from "@/features/journaling/journaling-metrics-sync";
import CreateDefaultMetricsButton from "@/features/daily-tracker/create-default-metrics-form";

export const Route = createFileRoute("/journaling")({
  component: JournalingPage,
});

function JournalingPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Journaling"
          description="Record your thoughts, ideas, gratitude, and affirmations"
          storageKey="journaling-page"
        >
          <CreateDefaultMetricsButton />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="About Journaling">
          <CompactInfoPanel
            title="Gratitude Journal"
            variant="info"
            storageKey="gratitude-journal-info-panel"
          >
            Record things you are grateful for each day to cultivate a positive
            mindset and increase overall happiness.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Creativity Journal"
            variant="tip"
            storageKey="creativity-journal-info-panel"
          >
            Capture your creative ideas, inspirations, and thoughts to nurture
            your creativity and track your insights.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Question Journal"
            variant="info"
            storageKey="question-journal-info-panel"
          >
            Explore important questions and record your reflections to deepen
            your understanding and personal growth.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Daily Affirmations"
            variant="tip"
            storageKey="affirmations-journal-info-panel"
          >
            Create positive statements to reinforce your goals, beliefs, and
            self-image.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <JournalingMetricsSync />
      <ReusableTabs
        tabs={[
          {
            id: "gratitude",
            label: (
              <span className="flex gap-2 items-center">
                <FEATURE_ICONS.HAND_HEART className="h-4 w-4" />
                <span className="hidden sm:inline">Gratitude</span>
              </span>
            ),
            content: <GratitudeJournalView />,
          },
          {
            id: "creativity",
            label: (
              <span className="flex gap-2 items-center">
                <FEATURE_ICONS.LIGHTBULB className="h-4 w-4" />
                <span className="hidden sm:inline">Creativity</span>
              </span>
            ),
            content: <CreativityJournalView />,
          },
          {
            id: "questions",
            label: (
              <span className="flex gap-2 items-center">
                <FEATURE_ICONS.PRESENTATION className="h-4 w-4" />
                <span className="hidden sm:inline">Questions</span>
              </span>
            ),
            content: <QuestionJournalView />,
          },
          {
            id: "affirmations",
            label: (
              <span className="flex gap-2 items-center">
                <FEATURE_ICONS.BOOK_HEART className="h-4 w-4" />
                <span className="hidden sm:inline">Affirmations</span>
              </span>
            ),
            content: <AffirmationView />,
          },
        ]}
        defaultTabId="gratitude"
        className="w-full"
        tabsListClassName="mb-4 grid grid-cols-4 w-full"
      />
    </FeatureLayout>
  );
}

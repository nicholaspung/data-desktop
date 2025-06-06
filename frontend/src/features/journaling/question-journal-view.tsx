import { useState } from "react";
import { Presentation, History, MessageSquare } from "lucide-react";
import QuestionOfTheDay from "./question-of-the-day";
import PreviousAnswers from "./previous-answers";
import QuestionJournalHistory from "./question-journal-history";
import { InfoPanel } from "@/components/reusable/info-panel";
import ReusableTabs from "@/components/reusable/reusable-tabs";

export default function QuestionJournalView() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Question Journaling</h2>
      <InfoPanel
        title="About Question Journaling"
        defaultExpanded={true}
        storageKey="question-journal-info-panel"
      >
        Question journaling is a powerful tool for self-reflection and personal
        growth. By answering thought-provoking questions, you can gain insights
        into your thoughts, feelings, and experiences. This practice can help
        you develop a deeper understanding of yourself and your life journey.
      </InfoPanel>
      <ReusableTabs
        tabs={[
          {
            id: "today",
            label: (
              <span className="flex gap-2 items-center">
                <Presentation className="h-4 w-4" />
                <span>Today's Question</span>
              </span>
            ),
            content: <QuestionOfTheDay setActiveTab={setActiveTab} />,
          },
          {
            id: "same",
            label: (
              <span className="flex gap-2 items-center">
                <MessageSquare className="h-4 w-4" />
                <span>Previous Answers</span>
              </span>
            ),
            content: <PreviousAnswers />,
          },
          {
            id: "history",
            label: (
              <span className="flex gap-2 items-center">
                <History className="h-4 w-4" />
                <span>History</span>
              </span>
            ),
            content: <QuestionJournalHistory />,
          },
        ]}
        defaultTabId={activeTab}
        onChange={setActiveTab}
        className="w-full"
        tabsListClassName="grid w-full grid-cols-3"
        tabsContentClassName="mt-6"
      />
    </div>
  );
}

// src/features/journaling/question-journal-page.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Presentation, History, MessageSquare } from "lucide-react";
import QuestionOfTheDay from "./question-of-the-day";
import SameQuestionAnswers from "./same-question-answers";
import QuestionJournalHistory from "./question-journal-history";
import { InfoPanel } from "@/components/reusable/info-panel";

export default function QuestionJournalView() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Question Journaling</h2>

      <InfoPanel title="About Question Journaling" defaultExpanded={true}>
        Question journaling is a powerful tool for self-reflection and personal
        growth. By answering thought-provoking questions, you can gain insights
        into your thoughts, feelings, and experiences. This practice can help
        you develop a deeper understanding of yourself and your life journey.
      </InfoPanel>

      <Tabs defaultValue="today" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="flex gap-2 items-center">
            <Presentation className="h-4 w-4" />
            <span>Today's Question</span>
          </TabsTrigger>
          <TabsTrigger value="same" className="flex gap-2 items-center">
            <MessageSquare className="h-4 w-4" />
            <span>Same Question Answers</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2 items-center">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <QuestionOfTheDay setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="same" className="mt-6">
          <SameQuestionAnswers />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <QuestionJournalHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

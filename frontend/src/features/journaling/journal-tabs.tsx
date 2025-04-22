// src/components/journaling/journal-tabs.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenLine, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ExpandableJournalEntries from "./expandable-journal-entries";
import { InfoPanel } from "@/components/reusable/info-panel";
import {
  Affirmation,
  CreativityJournalEntry,
  GratitudeJournalEntry,
} from "@/store/journaling-definitions";

export default function JournalTabs({
  title,
  entries,
  contentKey,
  addEntryForm,
  emptyStateText = "No entries yet.",
  infoTitle = "Info",
  infoText = "This is a journaling app where you can add and view your entries.",
}: {
  title: string;
  entries: Affirmation[] | GratitudeJournalEntry[] | CreativityJournalEntry[];
  contentKey: "entry" | "affirmation";
  addEntryForm: React.ReactNode;
  emptyStateText?: string;
  addButtonText?: string;
  infoTitle?: string;
  infoText?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("add");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      <InfoPanel title={infoTitle} defaultExpanded={true}>
        {infoText}
      </InfoPanel>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="add" className="flex gap-2 items-center">
            <PenLine className="h-4 w-4" />
            <span>Add New</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="flex gap-2 items-center">
            <List className="h-4 w-4" />
            <span>View All</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-0">
          <Card>
            <CardContent className="pt-6">{addEntryForm}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="mt-0">
          <ExpandableJournalEntries
            title=""
            entries={entries}
            contentKey={contentKey}
            emptyStateText={emptyStateText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

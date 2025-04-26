import { useState } from "react";
import { PenLine, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ExpandableJournalEntries from "./expandable-journal-entries";
import { InfoPanel } from "@/components/reusable/info-panel";
import {
  Affirmation,
  CreativityJournalEntry,
  GratitudeJournalEntry,
} from "@/store/journaling-definitions";
import ReusableTabs from "@/components/reusable/reusable-tabs";

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
      <ReusableTabs
        tabs={[
          {
            id: "add",
            label: (
              <span className="flex gap-2 items-center">
                <PenLine className="h-4 w-4" />
                <span>Add New</span>
              </span>
            ),
            content: (
              <Card>
                <CardContent className="pt-6">{addEntryForm}</CardContent>
              </Card>
            ),
          },
          {
            id: "view",
            label: (
              <span className="flex gap-2 items-center">
                <List className="h-4 w-4" />
                <span>View All</span>
              </span>
            ),
            content: (
              <ExpandableJournalEntries
                title=""
                entries={entries}
                contentKey={contentKey}
                emptyStateText={emptyStateText}
              />
            ),
          },
        ]}
        defaultTabId={activeTab}
        onChange={setActiveTab}
        className="w-full"
        tabsListClassName="grid grid-cols-2 mb-4"
        tabsContentClassName="mt-0"
      />
    </div>
  );
}

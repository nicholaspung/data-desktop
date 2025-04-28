// src/features/journaling/creativity-journal-view.tsx
import { useState, useEffect } from "react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import JournalTabs from "./journal-tabs";
import CreativityJournalForm from "./creativity-journal-form";
import { CreativityJournalEntry } from "@/store/journaling-definitions";
import TodaysCreativityEntry from "./todays-creativity-entry";

export default function CreativityJournalView() {
  const entries = useStore(dataStore, (state) => state.creativity_journal);
  const [todaysEntry, setTodaysEntry] = useState<CreativityJournalEntry | null>(
    null
  );

  useEffect(() => {
    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's entry if it exists
    const entry =
      entries.find((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      }) || null;

    setTodaysEntry(entry);
  }, [entries]);

  return (
    <JournalTabs
      title="Creativity Journal"
      entries={entries}
      contentKey="entry"
      addEntryForm={
        todaysEntry ? (
          <TodaysCreativityEntry entry={todaysEntry} />
        ) : (
          <CreativityJournalForm />
        )
      }
      emptyStateText="No creativity journal entries yet."
      addButtonText="Add Creativity Journal Entry"
      infoTitle="Creativity Journal"
      infoText="This is a creativity journal where you can add and view your entries. Expressing creativity can help improve your mood and overall well-being."
    />
  );
}

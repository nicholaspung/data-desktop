// src/features/journaling/gratitude-journal-view.tsx
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import JournalTabs from "./journal-tabs";
import CreativityJournalForm from "./creativity-journal-form";

export default function GratitudeJournalView() {
  const entries = useStore(dataStore, (state) => state.creativity_journal);

  return (
    <JournalTabs
      title="Creativity Journal"
      entries={entries}
      contentKey="entry"
      addEntryForm={<CreativityJournalForm />}
      emptyStateText="No creativity journal entries yet."
      addButtonText="Add Creativity Journal Entry"
      infoTitle="Creativity Journal"
      infoText="This is a creativity journal where you can add and view your entries. Expressing creativity can help improve your mood and overall well-being."
    />
  );
}

// src/features/journaling/gratitude-journal-view.tsx
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { GratitudeJournalEntry } from "@/store/journaling-definitions";
import JournalTabs from "./journal-tabs";
import GratitudeJournalForm from "./gratitude-journal-form";

export default function GratitudeJournalView() {
  const entries = useStore(
    dataStore,
    (state) => state.gratitude_journal as GratitudeJournalEntry[]
  );

  return (
    <JournalTabs
      title="Gratitude Journal"
      entries={entries}
      contentKey="entry"
      addEntryForm={<GratitudeJournalForm />}
      emptyStateText="No gratitude journal entries yet."
      addButtonText="Add Gratitude"
      infoTitle="Gratitude Journal"
      infoText="This is a gratitude journal where you can add and view your entries. Expressing gratitude can help improve your mood and overall well-being."
    />
  );
}

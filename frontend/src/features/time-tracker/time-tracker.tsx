// src/features/time-tracker/time-tracker.tsx
import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import TimeTrackerForm from "./time-tracker-form";
import TimeEntriesList from "./time-entries-list";
import TimeCategoryManager from "./time-category-manager";
import useLoadData from "@/hooks/useLoadData";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import ReusableTabs, { TabItem } from "@/components/reusable/reusable-tabs";

export default function TimeTracker() {
  const { getDatasetFields } = useFieldDefinitions();
  const timeEntryFields = getDatasetFields("time_entries");
  const timeCategoryFields = getDatasetFields("time_categories");

  const timeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );
  const categories = useStore(
    dataStore,
    (state) => state.time_categories as TimeCategory[]
  );
  const isLoadingEntries = useStore(
    loadingStore,
    (state) => state.time_entries
  );
  const isLoadingCategories = useStore(
    loadingStore,
    (state) => state.time_categories
  );

  const { loadData: loadTimeEntries } = useLoadData({
    fields: timeEntryFields,
    datasetId: "time_entries",
    title: "Time Entries",
    fetchDataNow: true,
  });

  const { loadData: loadCategories } = useLoadData({
    fields: timeCategoryFields,
    datasetId: "time_categories",
    title: "Categories",
    fetchDataNow: true,
  });

  const refreshData = () => {
    loadTimeEntries();
    loadCategories();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tabs: TabItem[] = [
    {
      id: "entries",
      label: "Time Entries",
      content: (
        <TimeEntriesList
          entries={timeEntries}
          categories={categories}
          isLoading={isLoadingEntries}
          onDataChange={refreshData}
        />
      ),
    },
    {
      id: "categories",
      label: "Categories",
      content: (
        <TimeCategoryManager
          categories={categories}
          isLoading={isLoadingCategories}
          onDataChange={refreshData}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <TimeTrackerForm categories={categories} onDataChange={refreshData} />

      <ReusableTabs tabs={tabs} defaultTabId="entries" fullWidth={true} />
    </div>
  );
}

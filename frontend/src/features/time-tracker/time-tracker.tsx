import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import loadingStore from "@/store/loading-store";
import { TimeEntry } from "@/store/time-tracking-definitions";
import TimeTrackerForm from "./time-tracker-form";
import TimeEntriesList from "./time-entries-list";
import TimeCategoryManager from "./time-category-manager";
import useLoadData from "@/hooks/useLoadData";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import ReusableTabs, { TabItem } from "@/components/reusable/reusable-tabs";
import TimeEntriesCalendar from "./time-entries-calendar";
import TimeEntriesSummary from "./time-entries-summary";
import { Calendar, LayoutList, Tags, PieChart } from "lucide-react";
import { useState } from "react";
import EditTimeEntryDialog from "./edit-time-entry-dialog";
import TimeFilterToggle from "@/components/reusable/time-filter-toggle";

export default function TimeTracker() {
  const { getDatasetFields } = useFieldDefinitions();
  const timeEntryFields = getDatasetFields("time_entries");
  const timeCategoryFields = getDatasetFields("time_categories");

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

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

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const tabs: TabItem[] = [
    {
      id: "summary",
      label: "Summary",
      icon: <PieChart className="h-4 w-4" />,
      content: <TimeEntriesSummary isLoading={isLoadingEntries} />,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <TimeEntriesCalendar
          isLoading={isLoadingEntries}
          onEditEntry={handleEditEntry}
        />
      ),
    },
    {
      id: "entries",
      label: "List",
      icon: <LayoutList className="h-4 w-4" />,
      content: (
        <TimeEntriesList
          isLoading={isLoadingEntries}
          onDataChange={refreshData}
        />
      ),
    },
    {
      id: "categories",
      label: "Categories",
      icon: <Tags className="h-4 w-4" />,
      content: (
        <TimeCategoryManager
          isLoading={isLoadingCategories}
          onDataChange={refreshData}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <TimeTrackerForm onDataChange={refreshData} />

      <TimeFilterToggle />

      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          onSave={() => {
            setEditingEntry(null);
            refreshData();
          }}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      <ReusableTabs tabs={tabs} defaultTabId="summary" fullWidth={true} />
    </div>
  );
}

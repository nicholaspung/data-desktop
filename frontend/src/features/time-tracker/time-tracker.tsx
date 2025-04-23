// src/features/time-tracker/time-tracker.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import TimeEntryForm from "./time-entry-form";
import TimeEntriesList from "./time-entries-list";
import TimeCategoryManager from "./time-category-manager";
import ActiveTimer from "./active-timer";
import useLoadData from "@/hooks/useLoadData";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";

export default function TimeTracker() {
  const { getDatasetFields } = useFieldDefinitions();
  const timeEntryFields = getDatasetFields("time_entries");
  const timeCategoryFields = getDatasetFields("time_categories");

  const [isActive, setIsActive] = useState(false);
  const [activeDescription, setActiveDescription] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    undefined
  );
  const [activeTags, setActiveTags] = useState<string>("");
  const [startTime, setStartTime] = useState<Date | null>(null);

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

  const handleStartTimer = (
    description: string,
    categoryId?: string,
    tags?: string
  ) => {
    setIsActive(true);
    setActiveDescription(description);
    setActiveCategory(categoryId);
    setActiveTags(tags || "");
    setStartTime(new Date());
  };

  const handleStopTimer = () => {
    setIsActive(false);
    setActiveDescription("");
    setActiveCategory(undefined);
    setActiveTags("");
    setStartTime(null);
  };

  const refreshData = () => {
    loadTimeEntries();
    loadCategories();
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {isActive ? (
            <ActiveTimer
              description={activeDescription}
              categoryId={activeCategory}
              tags={activeTags}
              startTime={startTime!}
              onStop={handleStopTimer}
              onComplete={refreshData}
              categories={categories}
            />
          ) : (
            <TimeEntryForm
              onStartTimer={handleStartTimer}
              onManualSave={refreshData}
              categories={categories}
            />
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <TimeEntriesList
            entries={timeEntries}
            categories={categories}
            isLoading={isLoadingEntries}
            onDataChange={refreshData}
          />
        </TabsContent>

        <TabsContent value="categories">
          <TimeCategoryManager
            categories={categories}
            isLoading={isLoadingCategories}
            onDataChange={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

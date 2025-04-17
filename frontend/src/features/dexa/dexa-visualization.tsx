// src/features/dexa/dexa-visualization.tsx
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import BodyCompositionTab from "./visualization/body-composition-tab";
import TrendsTab from "./visualization/trends-tab";
import RegionalAnalysisTab from "./visualization/regional-analysis-tab";
import SymmetryTab from "./visualization/symmetry-tab";
import BodyAnatomyTab from "./visualization/body-anatomy-tab"; // Import the new Body Anatomy tab
import GoalTab from "./goal/goal-tab";
import dataStore, { DataStoreName } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import loadingStore from "@/store/loading-store";
import ReusableSelect from "@/components/reusable/reusable-select";
import { DEXAScan } from "@/store/dexa-definitions";
import { cn } from "@/lib/utils";
import ReusableCard from "@/components/reusable/reusable-card";
import AddDexaScanButton from "./add-dexa-scan-button";
import EditDexaScanButton from "./edit-dexa-scan-button";

export default function DexaVisualization({
  className = "",
  datasetId,
}: {
  className?: string;
  datasetId: DataStoreName;
}) {
  const data =
    useStore(
      dataStore,
      (state) => state[datasetId as DataStoreName] as DEXAScan[]
    ) || []; // Get data from the store
  const isLoading =
    useStore(loadingStore, (state) => state[datasetId as DataStoreName]) ||
    false; // Get data from the loading store
  const [activeTab, setActiveTab] = useState("bodyComp");
  const [timeRange, setTimeRange] = useState("all");

  // Filter data based on time range
  const getFilteredData = () => {
    if (timeRange === "all" || data.length === 0) return data;

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    return data.filter((item: any) => item.date && item.date >= startDate);
  };

  if (isLoading) {
    return (
      <ReusableCard
        cardClassName={className}
        contentClassName="flex items-center justify-center py-10"
        content={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
      />
    );
  }

  if (data.length === 0) {
    return (
      <ReusableCard
        cardClassName={className}
        contentClassName="py-10"
        content={
          <div className="text-center">
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-muted-foreground mt-2">
              No DEXA scan data has been added yet. Add your first scan to see
              visualizations.
            </p>
          </div>
        }
      />
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">DEXA Scan Visualizations</h1>
        <div className="flex gap-2">
          <AddDexaScanButton />
          <EditDexaScanButton />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="bodyComp">Body Composition</TabsTrigger>
            <TabsTrigger value="bodyAnatomy">Body Anatomy</TabsTrigger>{" "}
            {/* New Body Anatomy tab */}
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
            <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Only show time range selector for trends and regional analysis tabs */}
        {(activeTab === "trends" || activeTab === "regional") && (
          <div className="flex gap-2">
            <ReusableSelect
              options={[
                { id: "all", label: "All Time" },
                { id: "3m", label: "Last 3 Months" },
                { id: "6m", label: "Last 6 Months" },
                { id: "1y", label: "Last Year" },
                { id: "2y", label: "Last 2 Years" },
              ]}
              value={timeRange}
              onChange={setTimeRange}
              placeholder={"Time Range"}
              triggerClassName={"w-[180px]"}
            />
          </div>
        )}
      </div>

      {/* Use direct conditional rendering instead of TabsContent */}
      <div className="space-y-6">
        {activeTab === "bodyComp" && <BodyCompositionTab data={filteredData} />}

        {/* Render the new Body Anatomy tab */}
        {activeTab === "bodyAnatomy" && <BodyAnatomyTab data={filteredData} />}

        {activeTab === "trends" && <TrendsTab data={filteredData} />}

        {activeTab === "regional" && (
          <RegionalAnalysisTab data={filteredData} />
        )}

        {activeTab === "symmetry" && <SymmetryTab data={filteredData} />}

        {activeTab === "goals" && <GoalTab data={filteredData} />}
      </div>
    </div>
  );
}

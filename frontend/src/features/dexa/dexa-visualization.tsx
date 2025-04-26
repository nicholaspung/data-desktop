import { useState } from "react";
import { Loader2 } from "lucide-react";
import BodyCompositionTab from "./visualization/body-composition-tab";
import TrendsTab from "./visualization/trends-tab";
import RegionalAnalysisTab from "./visualization/regional-analysis-tab";
import SymmetryTab from "./visualization/symmetry-tab";
import BodyAnatomyTab from "./visualization/body-anatomy-tab";
import GoalTab from "./goal/goal-tab";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import loadingStore from "@/store/loading-store";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableCard from "@/components/reusable/reusable-card";
import BoneDensityTab from "./visualization/bone-density-tab";
import AddDexaScanButton from "./add-dexa-scan-button";
import ReusableTabs from "@/components/reusable/reusable-tabs";

export default function DexaVisualization() {
  const data = useStore(dataStore, (state) => state.dexa) || [];
  const isLoading = useStore(loadingStore, (state) => state.dexa) || false;
  const [activeTab, setActiveTab] = useState("bodyComp");
  const [timeRange, setTimeRange] = useState("all");

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

  const filteredData = getFilteredData();

  const tabDefs = [
    {
      id: "bodyComp",
      label: "Body Composition",
      content: <BodyCompositionTab data={filteredData} />,
    },
    {
      id: "bodyAnatomy",
      label: "Body Anatomy",
      content: <BodyAnatomyTab data={filteredData} />,
    },
    {
      id: "boneDensity",
      label: "Bone Density",
      content: <BoneDensityTab data={filteredData} />,
    },
    {
      id: "trends",
      label: "Trends",
      content: <TrendsTab data={filteredData} />,
    },
    {
      id: "regional",
      label: "Regional Analysis",
      content: <RegionalAnalysisTab data={filteredData} />,
    },
    {
      id: "symmetry",
      label: "Symmetry",
      content: <SymmetryTab data={filteredData} />,
    },
    {
      id: "goals",
      label: "Goals",
      content: <GoalTab data={filteredData} />,
    },
  ];

  if (isLoading) {
    return (
      <ReusableCard
        contentClassName="flex items-center justify-center py-10"
        content={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
      />
    );
  }

  if (data.length === 0) {
    return (
      <ReusableCard
        contentClassName="py-10"
        content={
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-muted-foreground mt-2">
              No DEXA scan data has been added yet. Add your first scan to see
              visualizations.
            </p>
            <AddDexaScanButton />
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row lg:flex-col justify-between gap-4 mb-6">
        <ReusableTabs
          tabs={tabDefs}
          defaultTabId={activeTab}
          onChange={setActiveTab}
          className="space-y-4"
        />

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
    </div>
  );
}

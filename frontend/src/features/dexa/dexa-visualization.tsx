// src/features/dexa/dexa-visualization.tsx - Update with goals
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiService } from "@/services/api";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import BodyCompositionTab from "./visualization/body-composition-tab";
import TrendsTab from "./visualization/trends-tab";
import RegionalAnalysisTab from "./visualization/regional-analysis-tab";
import SymmetryTab from "./visualization/symmetry-tab";
import GoalTab from "./goal/goal-tab"; // Import the new Goals tab

export interface DexaScan {
  id: string;
  date: Date;
  createdAt: string;
  lastModified: string;
  [key: string]: any;
}

interface DexaVisualizationProps {
  className?: string;
}

export default function DexaVisualization({
  className = "",
}: DexaVisualizationProps) {
  const [data, setData] = useState<DexaScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bodyComp");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords<DexaScan>("dexa");

      if (!records || records.length === 0) {
        setData([]);
        setError("No DEXA scan data available. Please add some records first.");
        setIsLoading(false);
        return;
      }

      // Process and sort the data
      const processedRecords = records
        .map((record) => {
          // Ensure all numeric fields have at least a zero value
          const processedRecord = { ...record };
          // Check commonly used fields
          const numericFields = [
            "total_body_fat_percentage",
            "fat_tissue_lbs",
            "lean_tissue_lbs",
            "total_mass_lbs",
            "bone_mineral_content",
            "arms_total_region_fat_percentage",
            "legs_total_region_fat_percentage",
            "trunk_total_region_fat_percentage",
            "android_total_region_fat_percentage",
            "gynoid_total_region_fat_percentage",
            "right_arm_total_region_fat_percentage",
            "left_arm_total_region_fat_percentage",
            "right_leg_total_region_fat_percentage",
            "left_leg_total_region_fat_percentage",
            "right_arm_lean_tissue_lbs",
            "left_arm_lean_tissue_lbs",
            "right_leg_lean_tissue_lbs",
            "left_leg_lean_tissue_lbs",
            "vat_mass_lbs",
          ];

          numericFields.forEach((field) => {
            if (
              processedRecord[field] === undefined ||
              processedRecord[field] === null
            ) {
              processedRecord[field] = 0;
            }
          });

          return {
            ...processedRecord,
            date: new Date(record.date),
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setData(processedRecords);
    } catch (error) {
      console.error("Error loading DEXA data:", error);
      setError("Failed to load DEXA scan data");
    } finally {
      setIsLoading(false);
    }
  };

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

    return data.filter((item) => item.date >= startDate);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-10">
          <div className="text-center">
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-muted-foreground mt-2">
              {error ||
                "No DEXA scan data has been added yet. Add your first scan to see visualizations."}
            </p>
            <Button onClick={loadData} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="bodyComp">Body Composition</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
            <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Only show time range selector for trends and regional analysis tabs */}
        {(activeTab === "trends" || activeTab === "regional") && (
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="2y">Last 2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Use direct conditional rendering instead of TabsContent */}
      <div className="space-y-6">
        {activeTab === "bodyComp" && <BodyCompositionTab data={filteredData} />}

        {activeTab === "trends" && <TrendsTab data={filteredData} />}

        {activeTab === "regional" && (
          <RegionalAnalysisTab data={filteredData} />
        )}

        {activeTab === "symmetry" && <SymmetryTab data={filteredData} />}

        {/* Add the Goals tab */}
        {activeTab === "goals" && <GoalTab data={filteredData} />}
      </div>
    </div>
  );
}

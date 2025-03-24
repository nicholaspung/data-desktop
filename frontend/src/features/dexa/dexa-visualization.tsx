// src/features/dexa/dexa-visualization.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiService } from "@/services/api";
import { format } from "date-fns";
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
  const [selectedMetric, setSelectedMetric] = useState(
    "total_body_fat_percentage"
  );

  const metricOptions = [
    { value: "total_body_fat_percentage", label: "Body Fat %" },
    { value: "lean_tissue_lbs", label: "Lean Tissue (lbs)" },
    { value: "fat_tissue_lbs", label: "Fat Tissue (lbs)" },
    { value: "total_mass_lbs", label: "Total Mass (lbs)" },
    { value: "vat_mass_lbs", label: "VAT Mass (lbs)" },
    { value: "bone_density_g_cm2_total", label: "Bone Density (g/cm²)" },
    { value: "resting_metabolic_rate", label: "RMR (calories)" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log("Loading DEXA scan data...");
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords<DexaScan>("dexa");
      console.log("Fetched DEXA records:", records);

      if (!records || records.length === 0) {
        console.log("No DEXA records found");
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
          ];

          numericFields.forEach((field) => {
            if (
              processedRecord[field] === undefined ||
              processedRecord[field] === null
            ) {
              processedRecord[field] = 0;
              console.log(`Set missing field ${field} to 0`);
            }
          });

          return {
            ...processedRecord,
            date: new Date(record.date),
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      console.log("Processed DEXA records:", processedRecords);

      if (processedRecords.length > 0) {
        console.log(
          "First record fields:",
          Object.keys(processedRecords[0] as DexaScan)
            .filter(
              (key) =>
                typeof (processedRecords[0] as DexaScan)[key] === "number"
            )
            .join(", ")
        );
      }

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

  // Format date for charts
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
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
          </TabsList>
        </Tabs>

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

          {activeTab === "trends" && (
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Use direct conditional rendering instead of TabsContent */}
      <div className="space-y-6">
        {activeTab === "bodyComp" && (
          <BodyCompositionTab
            data={getFilteredData()}
            formatDate={formatDate}
          />
        )}

        {activeTab === "trends" && (
          <TrendsTab
            data={getFilteredData()}
            formatDate={formatDate}
            selectedMetric={selectedMetric}
            metricOptions={metricOptions}
          />
        )}

        {activeTab === "regional" && (
          <RegionalAnalysisTab
            data={getFilteredData()}
            formatDate={formatDate}
          />
        )}

        {activeTab === "symmetry" && <SymmetryTab data={getFilteredData()} />}
      </div>
    </div>
  );
}

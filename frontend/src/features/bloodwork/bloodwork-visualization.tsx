// src/features/bloodwork/bloodwork-visualization.tsx
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
import { LineChart } from "@/components/charts";
import { formatDate } from "@/lib/date-utils";

export interface BloodworkResult {
  id: string;
  date: Date;
  createdAt: string;
  lastModified: string;
  [key: string]: any;
}

interface BloodworkVisualizationProps {
  className?: string;
}

export default function BloodworkVisualization({
  className = "",
}: BloodworkVisualizationProps) {
  const [data, setData] = useState<BloodworkResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords<BloodworkResult>("bloodwork");

      if (!records || records.length === 0) {
        setData([]);
        setError("No bloodwork data available. Please add some records first.");
        setIsLoading(false);
        return;
      }

      // Process and sort the data
      const processedRecords = records
        .map((record) => ({
          ...record,
          date: new Date(record.date),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setData(processedRecords);
    } catch (error) {
      console.error("Error loading bloodwork data:", error);
      setError("Failed to load bloodwork data");
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

  // Generate line chart data for common markers
  const getMarkerTrendData = () => {
    return getFilteredData().map((item) => ({
      date: formatDate(item.date),
      cholesterol: item.cholesterol || 0,
      hdl: item.hdl || 0,
      ldl: item.ldl || 0,
      triglycerides: item.triglycerides || 0,
      dateObj: item.date,
    }));
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
                "No bloodwork data has been added yet. Add your first results to see visualizations."}
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lipids">Lipid Panel</TabsTrigger>
            <TabsTrigger value="metabolic">Metabolic</TabsTrigger>
            <TabsTrigger value="vitamins">Vitamins & Minerals</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Time range selector */}
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
      </div>

      {/* Tabs content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Key Markers Overview</h3>
              <LineChart
                data={getMarkerTrendData()}
                lines={[
                  {
                    dataKey: "cholesterol",
                    name: "Total Cholesterol",
                    // stroke: "#8884d8",
                  },
                  {
                    dataKey: "hdl",
                    name: "HDL",
                    // stroke: "#82ca9d",
                  },
                  {
                    dataKey: "ldl",
                    name: "LDL",
                    // stroke: "#ff7300",
                  },
                  {
                    dataKey: "triglycerides",
                    name: "Triglycerides",
                    // stroke: "#0088FE",
                  },
                ]}
                xAxisKey="date"
                title="Lipid Markers Trend"
                height={400}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === "lipids" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Lipid Panel Analysis</h3>
              <p className="text-muted-foreground mb-4">
                This tab would show detailed lipid panel analytics and
                comparisons to optimal ranges.
              </p>
              {/* Add lipid-specific content here */}
            </CardContent>
          </Card>
        )}

        {activeTab === "metabolic" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Metabolic Panel</h3>
              <p className="text-muted-foreground mb-4">
                This tab would show metabolic panel markers like glucose,
                insulin, HbA1c, etc.
              </p>
              {/* Add metabolic-specific content here */}
            </CardContent>
          </Card>
        )}

        {activeTab === "vitamins" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Vitamins & Minerals</h3>
              <p className="text-muted-foreground mb-4">
                This tab would track vitamin and mineral levels over time.
              </p>
              {/* Add vitamins-specific content here */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

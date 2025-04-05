// src/pages/index.tsx - Updated with null check
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  BarChart,
  FileSpreadsheet,
  HeartPulse,
  PieChart,
  ListTodo,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { DatasetSummary } from "@/types";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [summaries, setSummaries] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummaries = async () => {
      setIsLoading(true);
      try {
        // Get all datasets
        const datasets = await ApiService.getDatasets();

        // Add null check to handle case where datasets is null
        if (!datasets || datasets.length === 0) {
          setSummaries([]);
          setIsLoading(false);
          return;
        }

        // Create a list of promises to get record counts for each dataset
        const countPromises = datasets.map(async (dataset) => {
          try {
            const records = await ApiService.getRecords(dataset.id);
            let lastUpdated = null;

            if (records.length > 0) {
              // Find the most recent record
              const sortedRecords = [...records].sort(
                (a, b) =>
                  new Date(b.lastModified).getTime() -
                  new Date(a.lastModified).getTime()
              );
              lastUpdated = sortedRecords[0].lastModified;
            }

            return {
              id: dataset.id,
              name: dataset.name,
              count: records.length,
              lastUpdated,
              // Assign icons based on dataset type
              icon: getDatasetIcon(dataset.type),
              href: dataset.id.includes("blood")
                ? "/bloodwork"
                : `/${dataset.id}`,
            };
          } catch (error) {
            console.error(`Error getting records for ${dataset.id}:`, error);
            return {
              id: dataset.id,
              name: dataset.name,
              count: 0,
              lastUpdated: null,
              icon: getDatasetIcon(dataset.type),
              href: dataset.id.includes("blood")
                ? "/bloodwork"
                : `/${dataset.id}`,
            };
          }
        });

        // Wait for all promises to resolve
        const results = await Promise.all(countPromises);
        setSummaries(results);
      } catch (error) {
        console.error("Error loading dataset summaries:", error);
        // In case of error, set empty summaries to prevent UI errors
        setSummaries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummaries();
  }, []);

  // Helper function to get the icon for a dataset type
  const getDatasetIcon = (type: string) => {
    switch (type) {
      case "dexa":
        return <PieChart className="h-5 w-5" />;
      case "bloodwork":
        return <HeartPulse className="h-5 w-5" />;
      case "paycheck":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "habit":
        return <ListTodo className="h-5 w-5" />;
      default:
        return <BarChart className="h-5 w-5" />;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? // Loading state
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 w-24 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          : // Data summaries
            summaries.map((summary) => (
              <Link key={summary.id} to={summary.href} className="block">
                <Card className="hover:bg-accent/20 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      {summary.icon}
                      {summary.name}
                    </CardTitle>
                    <CardDescription>
                      {summary.lastUpdated
                        ? `Last updated: ${new Date(summary.lastUpdated).toLocaleDateString()}`
                        : "No data yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.count}</p>
                    <p className="text-sm text-muted-foreground">
                      total records
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}

        {/* Add New Dataset Card */}
        <Card className="border-dashed border-2 cursor-pointer hover:bg-accent/20 transition-colors h-full">
          <CardHeader className="pb-2">
            <CardTitle>Add New Dataset</CardTitle>
            <CardDescription>Create a custom dataset</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Stats Section */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Activity list will go here */}
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stats will go here */}
            <p className="text-muted-foreground">No stats available</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

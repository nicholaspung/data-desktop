// src/pages/index.tsx - Updated with null check
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, HeartPulse, PieChart, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { DatasetSummary, FieldDefinition } from "@/types/types";
import { DataStoreName, loadState } from "@/store/data-store";
import { getProcessedRecords } from "@/lib/data-utils";
import ReusableCard from "@/components/reusable/reusable-card";
import DEXADashboardSummary from "@/features/dashboard/dexa-dashboard-summary";
import { Separator } from "@/components/ui/separator";
import BloodworkDashboardSummary from "@/features/dashboard/bloodwork-dashboard-summary";
import ExperimentDashboardSummary from "@/features/dashboard/experiment-dashboard-summary";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [summaries, setSummaries] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          const processedRecords =
            (await getProcessedRecords(
              dataset.id as DataStoreName,
              dataset.fields as FieldDefinition[]
            )) || [];

          loadState(processedRecords, dataset.id as DataStoreName); // Load the records into the store

          return {
            id: dataset.id,
            name: dataset.name,
            count: processedRecords.length,
            lastUpdated: processedRecords[0]
              ? processedRecords[0].lastModified
              : null,
            // Assign icons based on dataset type
            icon: getDatasetIcon(dataset.type),
            href: `/dataset`,
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

  useEffect(() => {
    loadSummaries();
  }, []);

  // Helper function to get the icon for a dataset type
  const getDatasetIcon = (type: string) => {
    switch (type) {
      case "dexa":
        return <PieChart className="h-5 w-5" />;
      case "bloodwork":
        return <HeartPulse className="h-5 w-5" />;
      default:
        return <BarChart className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={async () => await loadSummaries()}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ExperimentDashboardSummary />
        <DEXADashboardSummary />
        <BloodworkDashboardSummary />
      </div>

      <div className="flex flex-col space-y-2">
        <h4 className="text-l font-bold">Dataset summary information</h4>
        <Separator />
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
              <Link to={summary.href} search={{ datasetId: summary.id }}>
                <ReusableCard
                  key={summary.id}
                  showHeader={false}
                  cardClassName="hover:bg-accent/20 transition-colors"
                  contentClassName="pt-6"
                  content={
                    <div className="flex flex-row justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          {summary.icon}
                          <span className="ml-2 font-bold">{summary.name}</span>
                        </div>
                        <span>
                          {summary.lastUpdated
                            ? `Last updated: ${new Date(summary.lastUpdated).toLocaleDateString()}`
                            : "No data yet"}
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{summary.count}</p>
                        <p className="text-sm text-muted-foreground">
                          total records
                        </p>
                      </div>
                    </div>
                  }
                />
              </Link>
            ))}
      </div>
    </div>
  );
}

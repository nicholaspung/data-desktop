// src/components/dashboard/bloodwork-summary.tsx
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  BloodResult,
  BloodworkTest,
  BloodMarker,
} from "@/store/bloodwork-definitions";

export default function BloodworkDashboardSummary() {
  const [loading, setLoading] = useState(true);
  const bloodworkTests = useStore(dataStore, (state) => state.bloodwork) || [];
  const bloodMarkers =
    useStore(dataStore, (state) => state.blood_markers) || [];
  const bloodResults =
    useStore(dataStore, (state) => state.blood_results) || [];

  const [latestTest, setLatestTest] = useState<BloodworkTest | null>(null);
  const [flaggedMarkers, setFlaggedMarkers] = useState<
    Array<{
      result: BloodResult & { marker?: BloodMarker };
      status: "high" | "low" | "optimal";
    }>
  >([]);

  // Key markers to highlight (customize as needed)
  const keyMarkerCategories = [
    "Lipids",
    "Metabolic",
    "Inflammation",
    "Thyroid",
  ];

  useEffect(() => {
    if (bloodworkTests.length === 0) {
      setLoading(false);
      return;
    }

    // Sort tests by date, newest first
    const sortedTests = [...bloodworkTests].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Set latest and previous test
    setLatestTest(sortedTests[0]);

    // If we have a latest test, find its results
    if (sortedTests[0]) {
      const latestResults = bloodResults.filter(
        (result) => result.blood_test_id === sortedTests[0].id
      );

      // Connect results with their marker definitions
      const resultsWithMarkers = latestResults.map((result) => {
        const marker = bloodMarkers.find(
          (m) => m.id === result.blood_marker_id
        );
        return { ...result, marker };
      });

      // Find flagged markers (outside optimal range)
      const flagged = resultsWithMarkers
        .filter((result) => result.marker && result.value_number !== undefined)
        .map((result) => {
          const { marker, value_number } = result;

          if (!marker || value_number === undefined) {
            return null;
          }

          let status: "high" | "low" | "optimal" = "optimal";

          // Check against optimal ranges first if available
          if (
            marker.optimal_low !== undefined &&
            marker.optimal_high !== undefined
          ) {
            if (value_number < marker.optimal_low) {
              status = "low";
            } else if (value_number > marker.optimal_high) {
              status = "high";
            }
          }
          // Fall back to reference ranges
          else if (
            marker.lower_reference !== undefined &&
            marker.upper_reference !== undefined
          ) {
            if (value_number < marker.lower_reference) {
              status = "low";
            } else if (value_number > marker.upper_reference) {
              status = "high";
            }
          }

          if (status !== "optimal") {
            return { result, status };
          }
          return null;
        })
        .filter(Boolean) as Array<{
        result: BloodResult & { marker?: BloodMarker };
        status: "high" | "low" | "optimal";
      }>;

      // Sort by most concerning first
      flagged.sort((a, b) => {
        // Sort by key categories first
        const aIsKey =
          a.result.marker &&
          keyMarkerCategories.includes(a.result.marker.category);
        const bIsKey =
          b.result.marker &&
          keyMarkerCategories.includes(b.result.marker.category);

        if (aIsKey && !bIsKey) return -1;
        if (!aIsKey && bIsKey) return 1;

        return 0;
      });

      setFlaggedMarkers(flagged.slice(0, 5)); // Show top 5 flagged markers
    }

    setLoading(false);
  }, [bloodworkTests, bloodMarkers, bloodResults]);

  // Helper to get status badge color
  const getStatusColor = (status: "high" | "low" | "optimal") => {
    switch (status) {
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      case "low":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "optimal":
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Bloodwork Summary
          <Link
            to="/bloodwork"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !latestTest ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No bloodwork data available</p>
            <Link
              to="/bloodwork"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Add your first blood test
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Latest Test</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold">
                  {latestTest ? formatDate(latestTest.date) : "N/A"}
                </p>
                <Badge variant={latestTest.fasted ? "success" : "outline"}>
                  {latestTest.fasted ? "Fasted" : "Non-fasted"}
                </Badge>
              </div>
              {latestTest.lab_name && (
                <p className="text-sm text-muted-foreground">
                  {latestTest.lab_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="font-medium">Flagged Markers</p>
              </div>

              {flaggedMarkers.length > 0 ? (
                <div className="space-y-2 mt-1">
                  {flaggedMarkers.map((flagged, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {flagged.status === "high" ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                        )}
                        <span>
                          {flagged.result.marker?.name || "Unknown Marker"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {flagged.result.value_number}{" "}
                          {flagged.result.marker?.unit}
                        </span>
                        <Badge className={getStatusColor(flagged.status)}>
                          {flagged.status === "high" ? "HIGH" : "LOW"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No markers outside optimal range
                </p>
              )}
            </div>

            <div className="pt-3 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Markers</p>
                  <p className="font-medium">
                    {
                      bloodResults.filter(
                        (r) => r.blood_test_id === latestTest.id
                      ).length
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Range</p>
                  <p className="font-medium">{flaggedMarkers.length}</p>
                </div>
              </div>
            </div>

            {latestTest.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{latestTest.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

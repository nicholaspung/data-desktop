// src/features/dashboard/bloodwork-dashboard-summary.tsx
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import {
  BloodResult,
  BloodworkTest,
  BloodMarker,
} from "@/store/bloodwork-definitions";
import ReusableSummary from "@/components/reusable/reusable-summary";

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
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "low":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "optimal":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "";
    }
  };

  return (
    <ReusableSummary
      title="Bloodwork Summary"
      linkTo="/bloodwork"
      loading={loading}
      titleIcon={<HeartPulse className="h-5 w-5" />}
      emptyState={
        !latestTest
          ? {
              message: "No bloodwork data available",
              actionText: "Add your first blood test",
              actionTo: "/bloodwork",
            }
          : undefined
      }
      mainSection={
        latestTest
          ? {
              title: "Latest Test",
              value: formatDate(latestTest.date),
              subText: latestTest.lab_name,
              badge: {
                variant: latestTest.fasted ? "success" : "outline",
                children: latestTest.fasted ? "Fasted" : "Non-fasted",
              },
            }
          : undefined
      }
      sections={[
        ...(flaggedMarkers.length > 0
          ? [
              {
                title: (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Flagged Markers</span>
                  </div>
                ),
                items: flaggedMarkers.map((flagged) => ({
                  label: (
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
                  ),
                  value: (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {flagged.result.value_number}{" "}
                        {flagged.result.marker?.unit}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flagged.status)}`}
                      >
                        {flagged.status === "high" ? "HIGH" : "LOW"}
                      </span>
                    </div>
                  ),
                })),
              },
            ]
          : [
              {
                items: [
                  {
                    label: "No markers outside optimal range",
                    value: "",
                  },
                ],
              },
            ]),
        ...(latestTest
          ? [
              {
                columns: 2 as const,
                className: "pt-3 border-t",
                items: [
                  {
                    label: "Total Markers",
                    value: bloodResults.filter(
                      (r) => r.blood_test_id === latestTest.id
                    ).length,
                  },
                  {
                    label: "Out of Range",
                    value: flaggedMarkers.length,
                  },
                ],
              },
            ]
          : []),
      ]}
      footer={
        latestTest?.notes ? (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{latestTest.notes}</p>
          </div>
        ) : undefined
      }
    />
  );
}

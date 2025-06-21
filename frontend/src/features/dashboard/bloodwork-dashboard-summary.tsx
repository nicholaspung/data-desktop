import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { FEATURE_ICONS } from "@/lib/icons";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import {
  BloodResult,
  BloodworkTest,
  BloodMarker,
} from "@/store/bloodwork-definitions";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { registerDashboardSummary } from "@/lib/dashboard-registry";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [markerCounts, setMarkerCounts] = useState({
    optimal: 0,
    outOfRange: 0,
    textValues: 0,
    noRange: 0,
  });
  const [monthsSinceLastTest, setMonthsSinceLastTest] = useState<number | null>(
    null
  );
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<string[]>([]);
  const [showMarkerSelector, setShowMarkerSelector] = useState(false);

  // Get stored selected markers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("bloodwork-dashboard-selected-markers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedMarkerIds(parsed.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to parse stored markers", e);
      }
    }
  }, []);

  // Save selected markers to localStorage
  useEffect(() => {
    if (selectedMarkerIds.length > 0) {
      localStorage.setItem(
        "bloodwork-dashboard-selected-markers",
        JSON.stringify(selectedMarkerIds)
      );
    }
  }, [selectedMarkerIds]);

  useEffect(() => {
    const keyMarkerCategories = [
      "Lipids",
      "Metabolic",
      "Inflammation",
      "Thyroid",
    ];

    if (bloodworkTests.length === 0) {
      // If no tests but markers are selected, show them with "No data"
      if (selectedMarkerIds.length > 0) {
        const selectedResults = selectedMarkerIds
          .map((markerId) => {
            const marker = bloodMarkers.find((m) => m.id === markerId);
            if (marker) {
              return {
                result: {
                  id: `placeholder-${markerId}`,
                  blood_test_id: "",
                  blood_marker_id: markerId,
                  value_number: undefined,
                  value_text: "No data",
                  unit_used: marker.unit,
                  created_at: "",
                  updated_at: "",
                  marker,
                } as BloodResult & { marker: BloodMarker },
                status: "optimal" as const,
              };
            }
            return null;
          })
          .filter(Boolean) as Array<{
          result: BloodResult & { marker?: BloodMarker };
          status: "high" | "low" | "optimal";
        }>;

        setFlaggedMarkers(selectedResults);
      }
      setLoading(false);
      return;
    }

    const sortedTests = [...bloodworkTests].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setLatestTest(sortedTests[0]);

    const now = new Date();
    const lastTestDate = new Date(sortedTests[0].date);
    const diffInMonths =
      (now.getFullYear() - lastTestDate.getFullYear()) * 12 +
      (now.getMonth() - lastTestDate.getMonth());
    setMonthsSinceLastTest(diffInMonths);

    if (sortedTests[0]) {
      const latestResults = bloodResults.filter(
        (result) => result.blood_test_id === sortedTests[0].id
      );

      const resultsWithMarkers = latestResults.map((result) => {
        const marker = bloodMarkers.find(
          (m) => m.id === result.blood_marker_id
        );
        return { ...result, marker };
      });

      let optimal = 0;
      let outOfRange = 0;
      let textValues = 0;
      let noRange = 0;

      const flagged = resultsWithMarkers
        .map((result) => {
          const { marker, value_number, value_text } = result;

          if (!marker) {
            return null;
          }

          if (value_text && !value_number) {
            textValues++;
            return null;
          }

          if (value_number === undefined) {
            return null;
          }

          let status: "high" | "low" | "optimal" = "optimal";
          let hasRange = false;

          if (
            marker.optimal_low !== undefined &&
            marker.optimal_high !== undefined
          ) {
            hasRange = true;
            if (value_number < marker.optimal_low) {
              status = "low";
              outOfRange++;
            } else if (value_number > marker.optimal_high) {
              status = "high";
              outOfRange++;
            } else {
              optimal++;
            }
          } else if (
            marker.lower_reference !== undefined &&
            marker.upper_reference !== undefined
          ) {
            hasRange = true;
            if (value_number < marker.lower_reference) {
              status = "low";
              outOfRange++;
            } else if (value_number > marker.upper_reference) {
              status = "high";
              outOfRange++;
            } else {
              optimal++;
            }
          }

          if (!hasRange) {
            noRange++;
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

      setMarkerCounts({ optimal, outOfRange, textValues, noRange });

      flagged.sort((a, b) => {
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

      // If user has selected specific markers, show those instead of flagged markers
      if (selectedMarkerIds.length > 0) {
        const selectedResults = selectedMarkerIds
          .map((markerId) => {
            const result = resultsWithMarkers.find(
              (r) => r.blood_marker_id === markerId
            );

            // If no result found, check if we have the marker definition
            if (!result) {
              const marker = bloodMarkers.find((m) => m.id === markerId);
              if (marker) {
                // Create a placeholder result for markers without data
                return {
                  result: {
                    id: `placeholder-${markerId}`,
                    blood_test_id: "",
                    blood_marker_id: markerId,
                    value_number: undefined,
                    value_text: "No data",
                    unit_used: marker.unit,
                    created_at: "",
                    updated_at: "",
                    marker,
                  } as BloodResult & { marker: BloodMarker },
                  status: "optimal" as const,
                };
              }
              return null;
            }

            const { marker, value_number } = result;
            let status: "high" | "low" | "optimal" = "optimal";

            if (marker && value_number !== undefined) {
              if (
                marker.optimal_low !== undefined &&
                marker.optimal_high !== undefined
              ) {
                if (value_number < marker.optimal_low) {
                  status = "low";
                } else if (value_number > marker.optimal_high) {
                  status = "high";
                }
              } else if (
                marker.lower_reference !== undefined &&
                marker.upper_reference !== undefined
              ) {
                if (value_number < marker.lower_reference) {
                  status = "low";
                } else if (value_number > marker.upper_reference) {
                  status = "high";
                }
              }
            }

            return { result, status };
          })
          .filter(Boolean) as Array<{
          result: BloodResult & { marker?: BloodMarker };
          status: "high" | "low" | "optimal";
        }>;

        setFlaggedMarkers(selectedResults);
      } else {
        setFlaggedMarkers(flagged.slice(0, 5));
      }
    }

    setLoading(false);
  }, [bloodworkTests, bloodMarkers, bloodResults, selectedMarkerIds]);

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
      titleIcon={<FEATURE_ICONS.BLOODWORK className="h-5 w-5" />}
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
              subText: `${latestTest.lab_name || "Unknown Lab"}${
                monthsSinceLastTest !== null
                  ? ` • ${monthsSinceLastTest} month${
                      monthsSinceLastTest !== 1 ? "s" : ""
                    } ago`
                  : ""
              }`,
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
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {selectedMarkerIds.length > 0 ? (
                        <Activity className="h-4 w-4 text-blue-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span>
                        {selectedMarkerIds.length > 0
                          ? "Selected Markers"
                          : "Flagged Markers"}
                      </span>
                    </div>
                    {bloodMarkers.length > 0 && (
                      <Popover
                        open={showMarkerSelector}
                        onOpenChange={setShowMarkerSelector}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-6 w-6"
                            title="Select markers to display"
                          >
                            <FEATURE_ICONS.SETTINGS className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm mb-1">
                                Select Markers to Display
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Choose up to 5 markers to show in the summary
                              </p>
                            </div>
                            <ReusableMultiSelect
                              options={bloodMarkers.map((marker) => ({
                                id: marker.id,
                                label: marker.name,
                                category: marker.category,
                              }))}
                              selected={selectedMarkerIds}
                              onChange={(ids) =>
                                setSelectedMarkerIds(ids.slice(0, 5))
                              }
                              placeholder="Search markers..."
                              title="markers"
                              useGroups={true}
                              groupByKey="category"
                              searchPlaceholder="Search by marker name..."
                              maxDisplay={0}
                            />
                            {selectedMarkerIds.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedMarkerIds([]);
                                  localStorage.removeItem(
                                    "bloodwork-dashboard-selected-markers"
                                  );
                                }}
                              >
                                Clear Selection
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ),
                items: flaggedMarkers.map((flagged) => ({
                  label: (
                    <div className="flex items-center gap-2">
                      {flagged.result.value_number !== undefined &&
                      flagged.status === "high" ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : flagged.result.value_number !== undefined &&
                        flagged.status === "low" ? (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>
                        {flagged.result.marker?.name || "Unknown Marker"}
                      </span>
                    </div>
                  ),
                  value: (
                    <div className="flex items-center gap-2">
                      {flagged.result.value_number !== undefined ? (
                        <>
                          <span className="font-medium">
                            {flagged.result.value_number}{" "}
                            {flagged.result.marker?.unit}
                          </span>
                          {flagged.status !== "optimal" && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flagged.status)}`}
                            >
                              {flagged.status === "high" ? "HIGH" : "LOW"}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No data
                        </span>
                      )}
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
                    label: "Optimal Range",
                    value: markerCounts.optimal,
                  },
                  {
                    label: "Out of Range",
                    value: markerCounts.outOfRange,
                  },
                  {
                    label: "Text Values",
                    value: markerCounts.textValues,
                  },
                  {
                    label: "No Range",
                    value: markerCounts.noRange,
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

registerDashboardSummary({
  route: "/bloodwork",
  component: BloodworkDashboardSummary,
  defaultConfig: {
    id: "/bloodwork",
    size: "small",
    height: "large",
    order: 9,
    visible: true,
  },
  datasets: ["bloodwork", "blood_markers", "blood_results"],
  name: "Bloodwork",
  description: "Track blood test results and markers",
  icon: FEATURE_ICONS.BLOODWORK,
});

import React, { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BloodworkSummary from "./bloodwork-summary";
import { BloodMarker, BloodResult } from "./bloodwork";
import BloodMarkerCard from "./blood-marker-card";
import { hasAnyRangeDefined } from "./bloodwork-utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { InfoPanel } from "@/components/reusable/info-panel";
import BloodMarkerManager from "./blood-marker-manager";

const BloodworkVisualizations: React.FC = () => {
  const bloodMarkers = useStore(
    dataStore,
    (state) => state.blood_markers || []
  ) as BloodMarker[];
  const bloodResults = useStore(
    dataStore,
    (state) => state.blood_results || []
  ) as BloodResult[];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "optimal" | "outOfRange" | "textValues" | "noRange" | null
  >(null);

  const toggleStatusFilter = (
    status: "optimal" | "outOfRange" | "textValues" | "noRange"
  ) => {
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  const markerResults: Record<string, BloodResult[]> = useMemo(() => {
    const results: Record<string, BloodResult[]> = {};

    bloodMarkers.forEach((marker) => {
      const markerResults = bloodResults.filter(
        (result) => result.blood_marker_id === marker.id
      );

      results[marker.id] = markerResults;
    });

    return results;
  }, [bloodMarkers, bloodResults]);

  const markerSummary = useMemo(() => {
    let optimal = 0;
    let outOfRange = 0;
    let textValues = 0;
    let noRange = 0;
    let noData = 0;

    bloodMarkers.forEach((marker) => {
      const results = markerResults[marker.id] || [];

      if (results.length === 0) {
        noData++;
        return;
      }

      if (!hasAnyRangeDefined(marker)) {
        noRange++;
        return;
      }

      const sortedResults = [...results].sort((a, b) => {
        return (
          new Date(b.blood_test_id_data?.date || 0).getTime() -
          new Date(a.blood_test_id_data?.date || 0).getTime()
        );
      });

      const latestResult = sortedResults[0];
      const value = parseFloat(latestResult.value_number.toString()) || 0;

      if (marker.optimal_general || marker.general_reference) {
        textValues++;
      } else if (
        marker.optimal_low !== undefined &&
        marker.optimal_high !== undefined &&
        value >= marker.optimal_low &&
        value <= marker.optimal_high
      ) {
        optimal++;
      } else {
        outOfRange++;
      }
    });

    return {
      optimal,
      outOfRange,
      textValues,
      noRange,
      noData,
      total: bloodMarkers.length,
    };
  }, [bloodMarkers, markerResults]);

  const categories: string[] = useMemo(() => {
    const uniqueCategories = new Set<string>();
    bloodMarkers.forEach((marker) => {
      if (marker.category) {
        uniqueCategories.add(marker.category);
      }
    });

    const hasUncategorizedMarkers = bloodMarkers.some(
      (marker) => !marker.category || marker.category.trim() === ""
    );
    if (hasUncategorizedMarkers) {
      uniqueCategories.add("Uncategorized");
    }

    return Array.from(uniqueCategories).sort();
  }, [bloodMarkers]);

  const groupedMarkers: Record<string, BloodMarker[]> = useMemo(() => {
    const filteredMarkers = bloodMarkers.filter((marker) => {
      const matchesSearch =
        searchTerm === "" ||
        marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (marker.description &&
          marker.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "Uncategorized"
          ? !marker.category || marker.category.trim() === ""
          : marker.category === selectedCategory);

      let matchesStatus = true;
      if (statusFilter) {
        const results = markerResults[marker.id] || [];

        if (statusFilter === "noRange") {
          return (
            matchesSearch &&
            matchesCategory &&
            !hasAnyRangeDefined(marker) &&
            results.length > 0
          );
        }

        if (results.length === 0) {
          return false;
        }

        if (
          (statusFilter === "optimal" || statusFilter === "outOfRange") &&
          !hasAnyRangeDefined(marker)
        ) {
          return false;
        }

        const sortedResults = [...results].sort((a, b) => {
          return (
            new Date(b.blood_test_id_data?.date || 0).getTime() -
            new Date(a.blood_test_id_data?.date || 0).getTime()
          );
        });

        const latestResult = sortedResults[0];
        const value = parseFloat(latestResult.value_number.toString()) || 0;

        if (statusFilter === "textValues") {
          matchesStatus = Boolean(
            marker.optimal_general || marker.general_reference
          );
        } else if (statusFilter === "optimal") {
          matchesStatus =
            marker.optimal_low !== undefined &&
            marker.optimal_high !== undefined &&
            value >= marker.optimal_low &&
            value <= marker.optimal_high;
        } else if (statusFilter === "outOfRange") {
          if (
            latestResult.value_text &&
            latestResult.value_text.trim() !== ""
          ) {
            const valueText = latestResult.value_text.toLowerCase();
            const isUnsureValue =
              valueText.includes("unsure") ||
              valueText.includes("undetermined") ||
              valueText.includes("unknown") ||
              valueText === "n/a";

            if (isUnsureValue) {
              matchesStatus = false;
            } else {
              const referenceText =
                marker.general_reference?.toLowerCase() || "";
              const optimalText = marker.optimal_general?.toLowerCase() || "";
              matchesStatus =
                hasAnyRangeDefined(marker) &&
                !valueText.includes(referenceText) &&
                !referenceText.includes(valueText) &&
                !valueText.includes(optimalText) &&
                !optimalText.includes(valueText);
            }
          } else {
            matchesStatus =
              hasAnyRangeDefined(marker) &&
              marker.optimal_low !== undefined &&
              marker.optimal_high !== undefined &&
              (value < marker.optimal_low || value > marker.optimal_high);
          }
        }
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    const grouped: Record<string, BloodMarker[]> = {};
    filteredMarkers.forEach((marker) => {
      const category = marker.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(marker);
    });

    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [bloodMarkers, searchTerm, selectedCategory, statusFilter, markerResults]);

  return (
    <div className="space-y-6">
      <InfoPanel
        title="About Reference Ranges"
        defaultExpanded={false}
        storageKey="bloodwork_reference_ranges_info"
      >
        There are two types of ranges for blood markers:
        <ol>
          <li>
            - <strong>Standard Reference Ranges</strong>: The ranges provided by
            labs, indicating what's normal for the general population
          </li>
          <li>
            - <strong>Optimal Ranges</strong>: Often narrower ranges associated
            with better health outcomes This tracker allows you to set both
            types of ranges for each marker.
          </li>
        </ol>
      </InfoPanel>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search markers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ReusableSelect
            options={[
              { id: "all", label: "All Categories" },
              ...categories.map((category) => ({
                id: category,
                label: category,
              })),
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder={"All Categories"}
            triggerClassName={"w-full sm:w-[180px]"}
          />
        </div>
      </div>

      {/* Summary Component with updated props */}
      <BloodworkSummary
        summary={markerSummary}
        statusFilter={statusFilter}
        onFilterChange={toggleStatusFilter}
        onClearFilter={() => setStatusFilter(null)}
      />

      {Object.keys(groupedMarkers).length === 0 ? (
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            {bloodMarkers.length === 0 ? (
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground">
                  No blood markers found. Please add some markers first.
                </p>
                <BloodMarkerManager />
              </div>
            ) : (
              <p className="text-muted-foreground">
                No markers match your filter criteria.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.keys(groupedMarkers)
          .sort()
          .map((category) => (
            <div key={category} className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-xl font-semibold">{category}</h2>
                <Separator className="flex-1" />
                <Badge variant="outline">
                  {groupedMarkers[category].length} markers
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedMarkers[category].map((marker) => (
                  <BloodMarkerCard
                    key={marker.id}
                    marker={marker}
                    results={markerResults[marker.id] || []}
                  />
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default BloodworkVisualizations;

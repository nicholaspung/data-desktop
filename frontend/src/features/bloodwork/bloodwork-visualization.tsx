// src/components/bloodwork/bloodwork-visualizations.tsx
import React, { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BloodworkSummary from "./bloodwork-summary";
import { BloodMarker, BloodResult } from "./bloodwork";
import BloodMarkerCard from "./blood-marker-card";

// Create the main visualization component
const BloodworkVisualizations: React.FC = () => {
  // Get data from store
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
    "optimal" | "outOfRange" | "textValues" | null
  >(null);

  // Toggle status filter
  const toggleStatusFilter = (
    status: "optimal" | "outOfRange" | "textValues"
  ) => {
    if (statusFilter === status) {
      setStatusFilter(null); // Clear filter if already selected
    } else {
      setStatusFilter(status); // Set new filter
    }
  };

  // Associate results with markers
  const markerResults: Record<string, BloodResult[]> = useMemo(() => {
    const results: Record<string, BloodResult[]> = {};

    bloodMarkers.forEach((marker) => {
      // Find all results for this marker
      const markerResults = bloodResults.filter(
        (result) => result.blood_marker_id === marker.id
      );

      results[marker.id] = markerResults;
    });

    return results;
  }, [bloodMarkers, bloodResults]);

  // Get summary stats for markers
  const markerSummary = useMemo(() => {
    let optimal = 0;
    let outOfRange = 0;
    let textValues = 0;
    let noData = 0;

    bloodMarkers.forEach((marker) => {
      const results = markerResults[marker.id] || [];

      if (results.length === 0) {
        noData++;
        return;
      }

      // Get the latest result
      const sortedResults = [...results].sort((a, b) => {
        return (
          new Date(a.blood_test_id_data?.date || 0).getTime() -
          new Date(b.blood_test_id_data?.date || 0).getTime()
        );
      });

      const latestResult = sortedResults[sortedResults.length - 1];
      const value = parseFloat(latestResult.value_number.toString()) || 0;

      // Check if it's a text-based range
      if (marker.optimal_general || marker.general_reference) {
        textValues++;
      }
      // Check if in optimal range
      else if (
        marker.optimal_low !== undefined &&
        marker.optimal_high !== undefined &&
        value >= marker.optimal_low &&
        value <= marker.optimal_high
      ) {
        optimal++;
      }
      // Otherwise out of range
      else {
        outOfRange++;
      }
    });

    return {
      optimal,
      outOfRange,
      textValues,
      noData,
      total: bloodMarkers.length,
    };
  }, [bloodMarkers, markerResults]);

  // Get unique categories from markers
  const categories: string[] = useMemo(() => {
    const uniqueCategories = new Set<string>();
    bloodMarkers.forEach((marker) => {
      if (marker.category) {
        uniqueCategories.add(marker.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [bloodMarkers]);

  // Filter and group markers by category
  const groupedMarkers: Record<string, BloodMarker[]> = useMemo(() => {
    // Filter by search term and category
    const filteredMarkers = bloodMarkers.filter((marker) => {
      const matchesSearch =
        searchTerm === "" ||
        marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (marker.description &&
          marker.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || marker.category === selectedCategory;

      // Apply status filter if active
      let matchesStatus = true;
      if (statusFilter) {
        const results = markerResults[marker.id] || [];

        // Skip markers with no results when filtering
        if (results.length === 0) {
          return false;
        }

        // Get the latest result
        const sortedResults = [...results].sort((a, b) => {
          return (
            new Date(a.blood_test_id_data?.date || 0).getTime() -
            new Date(b.blood_test_id_data?.date || 0).getTime()
          );
        });

        const latestResult = sortedResults[sortedResults.length - 1];
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
          matchesStatus =
            !marker.optimal_general &&
            !marker.general_reference &&
            (marker.optimal_low === undefined ||
              marker.optimal_high === undefined ||
              value < marker.optimal_low ||
              value > marker.optimal_high);
        }
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Group by category
    const grouped: Record<string, BloodMarker[]> = {};
    filteredMarkers.forEach((marker) => {
      const category = marker.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(marker);
    });

    // Sort each category by marker name
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [bloodMarkers, searchTerm, selectedCategory, statusFilter, markerResults]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Bloodwork Visualizations</h1>

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

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Component */}
      <BloodworkSummary
        summary={markerSummary}
        statusFilter={statusFilter}
        onFilterChange={toggleStatusFilter}
        onClearFilter={() => setStatusFilter(null)}
      />

      {Object.keys(groupedMarkers).length === 0 ? (
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">
              {bloodMarkers.length === 0
                ? "No blood markers found. Please add some markers first."
                : "No markers match your filter criteria."}
            </p>
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

// src/features/bloodwork/add-bloodwork-dialog.tsx
import { useState, useEffect } from "react";
import { PlusCircle, Search } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import dataStore, { addEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import BloodMarkerInput from "./blood-marker-input";
import useLoadData from "@/hooks/useLoadData";
import { useFieldDefinitions } from "../field-definitions/field-definitions-store";

export function AddBloodworkDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkResultFields = getDatasetFields("blood_results");
  const { loadData } = useLoadData({
    fields: bloodworkResultFields,
    datasetId: "blood_results",
    title: "Blood Results",
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fasted, setFasted] = useState(false);
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const [markerValues, setMarkerValues] = useState<
    Record<string, { value: string | number; valueType: "number" | "text" }>
  >({});
  const [isExistingDate, setIsExistingDate] = useState(false);
  const [existingBloodworkId, setExistingBloodworkId] = useState<string | null>(
    null
  );

  // Get blood markers from store
  const bloodMarkers = useStore(
    dataStore,
    (state) => state.blood_markers || []
  );
  const existingBloodwork = useStore(
    dataStore,
    (state) => state.bloodwork || []
  );
  const bloodResults = useStore(
    dataStore,
    (state) => state.blood_results || []
  );

  // Reset form data function
  const resetFormData = () => {
    setFasted(false);
    setLabName("");
    setNotes("");
    setMarkerValues({});
    setExistingBloodworkId(null);
  };

  // Get existing dates for dropdown
  const existingDates = [
    ...new Set(
      existingBloodwork.map((test) => {
        const testDate =
          test.date instanceof Date ? test.date : new Date(test.date);
        // Use UTC methods to avoid timezone issues
        return new Date(
          Date.UTC(
            testDate.getFullYear(),
            testDate.getMonth(),
            testDate.getDate()
          )
        )
          .toISOString()
          .split("T")[0];
      })
    ),
  ]
    .sort()
    .reverse();

  // Check if the current date is in existing dates
  useEffect(() => {
    const currentDateStr = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
      .toISOString()
      .split("T")[0];

    const exists = existingDates.includes(currentDateStr);
    setIsExistingDate(exists);

    // If selecting an existing date, find and pre-fill the bloodwork details
    if (exists) {
      const existingRecord = existingBloodwork.find((record) => {
        const recordDate =
          record.date instanceof Date ? record.date : new Date(record.date);
        const recordDateStr = new Date(
          Date.UTC(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          )
        )
          .toISOString()
          .split("T")[0];
        return recordDateStr === currentDateStr;
      });

      if (existingRecord) {
        setFasted(existingRecord.fasted || false);
        setLabName(existingRecord.lab_name || "");
        setNotes(existingRecord.notes || "");
        setExistingBloodworkId(existingRecord.id || null);

        // Populate marker values for this bloodwork record
        if (existingRecord.id) {
          const resultsForTest = bloodResults.filter(
            (result) => result.blood_test_id === existingRecord.id
          );

          // Clear existing marker values first
          setMarkerValues({});

          // Create a new marker values object with existing results
          const newMarkerValues: Record<
            string,
            { value: string | number; valueType: "number" | "text" }
          > = {};

          resultsForTest.forEach((result) => {
            if (result.value_text && result.value_text.trim() !== "") {
              newMarkerValues[result.blood_marker_id] = {
                value: result.value_text,
                valueType: "text",
              };
            } else {
              if (typeof result.value_number === "number") {
                newMarkerValues[result.blood_marker_id] = {
                  value: result.value_number,
                  valueType: "number",
                };
              }
            }
          });

          setMarkerValues(newMarkerValues);
        }
      }
    } else {
      // Reset form data when selecting a non-existing date
      resetFormData();
    }
  }, [date, existingDates, existingBloodwork, bloodResults]);

  // Reset form when dialog opens
  useEffect(() => {
    if (showAddDialog) {
      // Set to today's date
      setDate(new Date());
      // Reset form data
      resetFormData();
      // Reset search term
      setSearchTerm("");
    }
  }, [showAddDialog]);

  // Filter markers based on search term
  const filteredMarkers = bloodMarkers.filter(
    (marker) =>
      marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (marker.category &&
        marker.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle marker input change
  const handleMarkerChange = (
    markerId: string,
    value: string | number,
    valueType: "number" | "text"
  ) => {
    setMarkerValues((prev) => ({
      ...prev,
      [markerId]: { value, valueType },
    }));
  };

  // Check if form is valid
  const isFormValid = () => {
    return date && Object.keys(markerValues).length > 0;
  };

  // Helper function to check if a result already exists for this marker
  const resultExistsForMarker = (markerId: string) => {
    if (!existingBloodworkId) return false;
    return bloodResults.some(
      (result) =>
        result.blood_test_id === existingBloodworkId &&
        result.blood_marker_id === markerId
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error("Please select a date and add at least one marker value");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create or get bloodwork record for the date
      // Check if we already have a bloodwork record for this date
      const existingRecord = existingBloodwork.find((record) => {
        const recordDate =
          record.date instanceof Date ? record.date : new Date(record.date);
        return (
          recordDate.toISOString().split("T")[0] ===
          date.toISOString().split("T")[0]
        );
      });

      let bloodworkId;

      if (existingRecord) {
        // Use existing bloodwork record
        bloodworkId = existingRecord.id;
      } else {
        // Create new bloodwork record
        const bloodworkData = {
          date,
          fasted,
          lab_name: labName,
          notes,
        };

        const response = await ApiService.addRecord("bloodwork", bloodworkData);
        if (!response) {
          throw new Error("Failed to create bloodwork record");
        }
        addEntry(response, "bloodwork");
        bloodworkId = response.id;
      }

      // 2. Create blood result records for each filled marker
      const resultPromises = Object.keys(markerValues)
        .filter((key) => {
          const data = markerValues[key];
          // Skip empty values
          if (typeof data.value === "string") return data.value.trim() !== "";
          return data.value !== null && data.value !== undefined;
        })
        // Skip existing results if it's an existing date
        .filter((markerId) => {
          if (!existingBloodworkId) return true;
          // Only add results for markers that don't have results yet
          return !resultExistsForMarker(markerId);
        })
        .map(async (markerId) => {
          const data = markerValues[markerId];
          const resultData = {
            blood_test_id: bloodworkId,
            blood_marker_id: markerId,
            value_number: data.valueType === "number" ? Number(data.value) : 0,
            value_text: data.valueType === "text" ? String(data.value) : "",
          };

          // Use await to wait for the response
          return await ApiService.addRecord("blood_results", resultData);
        });

      await Promise.all(resultPromises);

      loadData();

      toast.success("Bloodwork results added successfully");

      // Reset form and close dialog
      resetFormData();
      setSearchTerm("");

      if (onSuccess) {
        onSuccess();
      }

      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding bloodwork:", error);
      toast.error("Failed to add bloodwork results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLastResultForMarker = (markerId: string) => {
    // Sort all results for this marker by date (newest first)
    const resultsForMarker = bloodResults
      .filter((result) => result.blood_marker_id === markerId)
      .sort((a, b) => {
        const dateA = a.blood_test_id_data?.date
          ? new Date(a.blood_test_id_data.date).getTime()
          : 0;
        const dateB = b.blood_test_id_data?.date
          ? new Date(b.blood_test_id_data.date).getTime()
          : 0;
        return dateB - dateA;
      });

    // Return the most recent result, or null if none exists
    return resultsForMarker.length > 0 ? resultsForMarker[0] : undefined;
  };

  return (
    <ReusableDialog
      title="Add Bloodwork Results"
      description="Add new bloodwork results by date. Fill in values only for the markers you want to record."
      open={showAddDialog}
      onOpenChange={() => setShowAddDialog((prev) => !prev)}
      confirmText="Save Results"
      confirmIcon={<span>💾</span>}
      onConfirm={handleSubmit}
      trigger={
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Bloodwork
        </Button>
      }
      contentClassName="sm:max-w-[800px]"
      loading={isSubmitting}
      footerActionDisabled={!isFormValid()}
      footerActionLoadingText="Saving..."
      customContent={
        <div className="space-y-6 p-4 overflow-y-auto max-h-[70vh]">
          {/* Bloodwork date selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Test Date{" "}
              {isExistingDate && (
                <span className="text-blue-500 ml-1">(Existing)</span>
              )}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : "Select date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                {existingDates.length > 0 && (
                  <div className="p-2 border-b">
                    <div className="text-sm font-medium mb-1">
                      Existing test dates:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {existingDates.slice(0, 5).map((dateStr) => {
                        const [year, monthPlus1, day] = dateStr.split("-");

                        return (
                          <Button
                            key={dateStr}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDate(
                                new Date(
                                  new Date(
                                    Number(year),
                                    Number(monthPlus1) - 1,
                                    Number(day)
                                  )
                                )
                              )
                            }
                          >
                            {format(
                              new Date(
                                Number(year),
                                Number(monthPlus1) - 1,
                                Number(day)
                              ),
                              "MMM d, yyyy"
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Additional bloodwork details - only show for new dates */}
          {!isExistingDate && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fasted</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={fasted ? "true" : "false"}
                    onChange={(e) => setFasted(e.target.value === "true")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lab Name</label>
                  <Input
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="Lab or facility name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this test"
                />
              </div>
            </>
          )}

          {/* Search and filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search markers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Markers list */}
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-2 text-sm font-medium">
              Blood Markers
            </div>

            {filteredMarkers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {bloodMarkers.length === 0
                  ? "No blood markers found. Please add markers first."
                  : "No markers match your search criteria."}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {filteredMarkers.map((marker) => {
                  // Check if this marker already has results for the selected date
                  const hasExistingResult = resultExistsForMarker(marker.id);
                  const lastResult = getLastResultForMarker(marker.id);

                  return (
                    <BloodMarkerInput
                      key={marker.id}
                      marker={marker}
                      value={markerValues[marker.id]?.value || ""}
                      valueType={markerValues[marker.id]?.valueType || "number"}
                      onChange={(value, valueType) =>
                        handleMarkerChange(marker.id, value, valueType)
                      }
                      disabled={isExistingDate && hasExistingResult}
                      isExisting={hasExistingResult}
                      lastResult={lastResult}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {isExistingDate && (
            <div className="text-sm text-muted-foreground">
              <p>
                Note: For existing test dates, you can only add results for
                markers that don't already have values. Existing marker results
                are displayed but can't be modified.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}

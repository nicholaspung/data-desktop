// src/features/bloodwork/add-bloodwork-dialog.tsx
import { useState } from "react";
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
import { BloodMarker } from "./bloodwork";
import BloodMarkerInput from "./blood-marker-input";

export function AddBloodworkDialog({ onSuccess }: { onSuccess?: () => void }) {
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

  // Get blood markers from store
  const bloodMarkers = useStore(
    dataStore,
    (state) => state.blood_markers || []
  ) as BloodMarker[];
  const existingBloodwork = useStore(
    dataStore,
    (state) => state.bloodwork || []
  );

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
        .map(async (markerId) => {
          const data = markerValues[markerId];
          const resultData = {
            blood_test_id: bloodworkId,
            blood_marker_id: markerId,
            value_number: data.valueType === "number" ? Number(data.value) : 0,
            value_text: data.valueType === "text" ? String(data.value) : "",
          };

          const response = ApiService.addRecord("blood_results", resultData);
          if (response) {
            addEntry(response, "blood_results");
          }
          return response;
        });

      await Promise.all(resultPromises);

      toast.success("Bloodwork results added successfully");

      // Reset form and close dialog
      setMarkerValues({});
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
      loading={isSubmitting}
      footerActionDisabled={!isFormValid()}
      footerActionLoadingText="Saving..."
      customContent={
        <div className="space-y-6 p-4 overflow-y-auto max-h-[70vh]">
          {/* Bloodwork date selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Date</label>
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

          {/* Additional bloodwork details */}
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
                {filteredMarkers.map((marker) => (
                  <BloodMarkerInput
                    key={marker.id}
                    marker={marker}
                    value={markerValues[marker.id]?.value || ""}
                    valueType={markerValues[marker.id]?.valueType || "number"}
                    onChange={(value, valueType) =>
                      handleMarkerChange(marker.id, value, valueType)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

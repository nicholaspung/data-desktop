// src/components/data-table/batch-entry-table.tsx
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ConfirmResetDialog } from "@/components/reusable/confirm-reset-dialog";
import { Badge } from "../ui/badge";
import { FieldDefinition } from "@/types/types";
import { resolveRelationReferences } from "@/lib/relation-utils";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { createCSVTemplate, parseCSV } from "@/lib/csv-parser";
import BatchEntryImportButtons from "./batch-entry-import-buttons";
import SavedDataBadge from "../reusable/saved-data-badge";
import useLoadData from "@/hooks/useLoadData";
import dataStore, { DataStoreName } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";
import ReusableSelect from "../reusable/reusable-select";
import ReusableMultiSelect from "../reusable/reusable-multiselect";

export function BatchEntryTable({
  datasetId,
  fields,
  title,
  onSuccess,
  maxBatchSize = 50,
  onNavigateToTable,
}: {
  datasetId: DataStoreName;
  fields: FieldDefinition[];
  title: string;
  onSuccess?: () => void;
  maxBatchSize?: number;
} & {
  onNavigateToTable?: () => void;
}) {
  const allData = useStore(dataStore, (state) => state);
  const { loadData } = useLoadData({
    fields,
    datasetId,
    title,
  });
  // Create a storage key specific to this dataset
  const storageKey = `batch_entry_${datasetId}`;

  // Main state for entries
  const [entries, setEntries] = useState<Record<string, any>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Find relation fields
  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  // Function to create a new empty entry
  function getEmptyEntry(): Record<string, any> {
    const entry: Record<string, any> = { id: crypto.randomUUID() };

    fields.forEach((field) => {
      switch (field.type) {
        case "date":
          entry[field.key] = new Date();
          break;
        case "boolean":
          entry[field.key] = false;
          break;
        case "number":
        case "percentage":
          entry[field.key] = 0;
          break;
        case "text":
          entry[field.key] = "";
          break;
      }
    });

    return entry;
  }

  // Load entries from localStorage on initial render
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem(storageKey);
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);

        // Process the entries to convert date strings back to Date objects
        const processedEntries = parsedEntries.map(
          (entry: Record<string, any>) => {
            const processedEntry = { ...entry };

            fields.forEach((field) => {
              if (field.type === "date" && processedEntry[field.key]) {
                processedEntry[field.key] = new Date(processedEntry[field.key]);
              }
            });

            return processedEntry;
          }
        );

        setEntries(processedEntries);

        // Only set hasSavedData to true if there are meaningful entries
        // (more than 1 entry or 1 entry that has some filled data)
        const hasRealData = hasNonEmptyEntries(processedEntries);
        setHasSavedData(hasRealData);

        if (hasRealData) {
          toast.info("Loaded saved entries from your previous session");
        } else {
          // If there's only empty data, remove it from storage to clean up
          localStorage.removeItem(storageKey);
          setEntries([getEmptyEntry()]);
        }
      } else {
        // Initialize with a single empty entry if no saved data
        setEntries([getEmptyEntry()]);
      }
    } catch (error) {
      console.error("Error loading saved entries:", error);
      setEntries([getEmptyEntry()]);
    }
  }, [datasetId, fields]);

  // Helper function to check if entries have meaningful data
  const hasNonEmptyEntries = (entriesArray: Record<string, any>[]) => {
    // If there are multiple entries, we definitely have data
    if (entriesArray.length > 1) return true;

    // If there's only one entry, check if it has any non-default values
    if (entriesArray.length === 1) {
      const entry = entriesArray[0];

      // Check each field to see if it's been modified from default
      for (const field of fields) {
        const value = entry[field.key];

        switch (field.type) {
          case "text":
            if (value && value.trim() !== "") return true;
            break;
          case "number":
          case "percentage":
            // If the value is significantly different from 0, it's been changed
            if (value !== 0 && value !== null && value !== undefined)
              return true;
            break;
          case "boolean":
            // If boolean is true, it's been changed from default false
            if (value === true) return true;
            break;
          case "select-single":
            // For select fields, check if a non-default option was selected
            // If it has options and the first option is not selected (assuming first is default)
            if (field.options && field.options.length > 0) {
              const defaultValue = field.options[0].id;
              if (value && value !== defaultValue) return true;
            }
            // If there's a value but no options defined (should be rare)
            else if (value && value.trim() !== "") {
              return true;
            }
            break;
          case "select-multiple":
            // For multi-select fields, check if the array has any items
            if (Array.isArray(value) && value.length > 0) {
              return true;
            }
            break;
          case "date":
            // Date is more complex - most entries will have a date
            // Here we could add special logic if needed
            break;
        }
      }
    }

    return false;
  };

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length > 0) {
      try {
        // Check if there's meaningful data worth saving
        const hasData = hasNonEmptyEntries(entries);

        if (hasData) {
          // Convert Date objects to ISO strings for safe storage
          const entriesToSave = entries.map((entry) => {
            const entryCopy = { ...entry };

            fields.forEach((field) => {
              if (
                field.type === "date" &&
                entryCopy[field.key] instanceof Date
              ) {
                entryCopy[field.key] = entryCopy[field.key].toISOString();
              }
            });

            return entryCopy;
          });

          localStorage.setItem(storageKey, JSON.stringify(entriesToSave));
          setHasSavedData(true);
        } else {
          // No meaningful data, remove from storage and don't show badge
          localStorage.removeItem(storageKey);
          setHasSavedData(false);
        }
      } catch (error) {
        console.error("Error handling entries localStorage:", error);
      }
    }
  }, [entries, datasetId, fields]);

  // Add a new empty entry
  const addEntry = () => {
    if (entries.length >= maxBatchSize) {
      toast.warning(
        `Maximum of ${maxBatchSize} entries allowed in a single batch`
      );
      return;
    }
    setEntries([...entries, getEmptyEntry()]);
  };

  // Remove an entry
  const removeEntry = (index: number) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);

    // If removing the last entry, add an empty one
    if (newEntries.length === 0) {
      newEntries.push(getEmptyEntry());
    }

    setEntries(newEntries);
  };

  // Update an entry field
  const updateEntryField = (
    entryIndex: number,
    fieldKey: string,
    value: any
  ) => {
    const newEntries = [...entries];
    newEntries[entryIndex] = { ...newEntries[entryIndex], [fieldKey]: value };
    setEntries(newEntries);
  };

  // Resolve relation display values to IDs using our utility function
  const resolveRelationRefs = async (entriesData: Record<string, any>[]) => {
    // If no relation fields, just return the original data
    if (relationFields.length === 0) return entriesData;

    try {
      // Use our utility function to resolve references
      return await resolveRelationReferences(entriesData, fields);
    } catch (error) {
      console.error("Error resolving relation references:", error);
      // Return the original data if there's an error
      return entriesData;
    }
  };

  // Submit all entries to the backend
  const submitEntries = async () => {
    if (entries.length === 0) {
      toast.error("No entries to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve relation references before submission
      const processedEntries = await resolveRelationRefs(entries);

      // Prepare entries for submission (remove temporary id)
      const entriesToSubmit = processedEntries.map((entry) => {
        const rest = { ...entry };
        delete rest.id; // Remove the temporary ID for submission
        return rest;
      });

      // Use the importRecords API to batch import
      const count = await ApiService.importRecords(datasetId, entriesToSubmit);

      if (count > 0) {
        toast.success(`Successfully added ${count} ${title} records`);

        // Clear entries from localStorage
        localStorage.removeItem(storageKey);
        setHasSavedData(false);

        // Reset entries to a single empty one
        setEntries([getEmptyEntry()]);

        await loadData(); // Reload data to reflect changes

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Navigate to the data table view if handler is provided
        if (onNavigateToTable) {
          onNavigateToTable();
        }
      } else {
        toast.error("No records were added");
      }
    } catch (error) {
      console.error("Error submitting batch entries:", error);
      toast.error("Failed to submit entries");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear all entries
  const clearEntries = () => {
    setEntries([getEmptyEntry()]);
    localStorage.removeItem(storageKey);
    setHasSavedData(false);
    toast.info("All entries cleared");
  };

  // Handle CSV import with relation field resolution
  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);

    try {
      // Parse the CSV file
      const parsedData = await parseCSV(file, fields);

      // Process relation fields
      const processedData = await resolveRelationRefs(parsedData);

      // Limit to max batch size
      const limitedData = processedData.slice(0, maxBatchSize);

      if (limitedData.length > 0) {
        // Add temporary IDs for React keys
        const dataWithIds = limitedData.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));

        setEntries(dataWithIds);

        if (parsedData.length > maxBatchSize) {
          toast.warning(
            `Loaded first ${maxBatchSize} records from CSV. Please submit these first before importing more.`
          );
        } else {
          toast.success(`Loaded ${limitedData.length} records from CSV`);
        }
      } else {
        toast.error("No valid data found in CSV");
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsSubmitting(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Handle template download
  const handleDownloadTemplate = () => {
    const csvContent = createCSVTemplate(fields);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${datasetId}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a table cell based on the field type
  const renderCell = (
    entry: Record<string, any>,
    field: FieldDefinition,
    entryIndex: number
  ) => {
    const value = entry[field.key];

    // Set a minimum width for all cell contents
    const cellStyle = { minWidth: "80px", width: "100%" };

    // Handle relation fields with dropdown
    if (field.isRelation && field.relatedDataset) {
      const options = generateOptionsForLoadRelationOptions(
        allData[field.relatedDataset as DataStoreName] || [],
        field
      );

      // Convert empty string to placeholder value for display purposes
      const displayValue = value === "" ? "_none_" : value || "_none_";

      const onValueChange = (newValue: string) => {
        // Convert placeholder value back to appropriate value when saving
        const valueToSave = newValue === "_none_" ? "" : newValue;
        updateEntryField(entryIndex, field.key, valueToSave);
      };

      return (
        <div style={cellStyle}>
          <ReusableSelect
            options={options}
            value={displayValue}
            onChange={onValueChange}
            title={field.displayName}
            triggerClassName={"h-8 w-full"}
            noDefault={false}
          />
        </div>
      );
    }

    // Handle other field types
    switch (field.type) {
      case "text":
        return (
          <div style={cellStyle}>
            <Input
              value={value || ""}
              onChange={(e) =>
                updateEntryField(entryIndex, field.key, e.target.value)
              }
              className="h-8 w-full"
            />
          </div>
        );

      case "number":
      case "percentage":
        return (
          <div style={cellStyle}>
            <Input
              type="number"
              value={value}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? 0 : parseFloat(e.target.value);
                updateEntryField(entryIndex, field.key, isNaN(val) ? 0 : val);
              }}
              className="h-8 w-full"
              step="any"
              min={0}
              max={field.type === "percentage" ? 100 : undefined}
            />
          </div>
        );

      case "boolean":
        return (
          <div className="flex justify-center" style={cellStyle}>
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) =>
                updateEntryField(entryIndex, field.key, !!checked)
              }
            />
          </div>
        );

      case "date":
        return (
          <div style={cellStyle}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-start text-left font-normal"
                >
                  {value ? format(value, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) =>
                    updateEntryField(entryIndex, field.key, date)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "select-single":
        return (
          <ReusableSelect
            options={field.options || []}
            value={value}
            onChange={(value) => updateEntryField(entryIndex, field.key, value)}
            title={field.displayName}
            triggerClassName="w-full"
          />
        );

      case "select-multiple":
        return (
          <div style={{ minWidth: "500px", width: "100%" }}>
            <ReusableMultiSelect
              options={field.options || []}
              selected={value ? value : []}
              onChange={(values) =>
                updateEntryField(entryIndex, field.key, values)
              }
              title={field.displayName}
            />
          </div>
        );

      default:
        return <span style={cellStyle}>{JSON.stringify(value)}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{title} Batch Entry</CardTitle>
          {hasSavedData && <SavedDataBadge />}
        </div>
        <BatchEntryImportButtons
          fileInputRef={fileInputRef}
          isSubmitting={isSubmitting}
          handleImportCSV={handleImportCSV}
          handleDownloadTemplate={handleDownloadTemplate}
        />
      </CardHeader>

      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Status bar */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </Badge>

            <div className="flex gap-2">
              {/* Add Entry Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={addEntry}
                disabled={isSubmitting || entries.length >= maxBatchSize}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>

              {/* Reset/Clear Button */}
              <ConfirmResetDialog
                onConfirm={clearEntries}
                trigger={
                  <Button variant="outline" size="sm" disabled={isSubmitting}>
                    <Trash className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                }
                title="Clear all entries?"
                description="This will remove all current entries and cannot be undone. Your data will be removed from local storage."
              />
            </div>
          </div>

          {/* Table of entries */}
          <div className="border rounded-md">
            <div className="overflow-auto max-h-[500px]">
              <div style={{ minWidth: "100%", overflowX: "auto" }}>
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      {/* Delete Button Header */}
                      <TableHead style={{ minWidth: "50px", width: "50px" }}>
                        {/* Empty header for delete button column */}
                      </TableHead>
                      {fields.map((field) => (
                        <TableHead
                          key={field.key}
                          className="whitespace-nowrap"
                          style={{ minWidth: "80px" }}
                        >
                          {field.displayName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {entries.map((entry, entryIndex) => (
                      <TableRow key={entry.id}>
                        {/* Delete Button Cell */}
                        <TableCell
                          style={{
                            minWidth: "50px",
                            width: "50px",
                            padding: "0 4px",
                          }}
                        >
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEntry(entryIndex)}
                              disabled={entries.length <= 1 && entryIndex === 0}
                              className="h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                        {fields.map((field) => (
                          <TableCell
                            key={`${entry.id}-${field.key}`}
                            style={{ minWidth: "80px" }}
                          >
                            {renderCell(entry, field, entryIndex)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={submitEntries}
              disabled={isSubmitting || entries.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit All Entries
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

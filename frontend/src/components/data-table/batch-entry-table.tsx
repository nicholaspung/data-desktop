// src/components/data-table/batch-entry-table.tsx
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash, Upload, Download, Loader2 } from "lucide-react";
import { FieldDefinition } from "@/types";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { parseCSV, createCSVTemplate } from "@/lib/csv-parser";
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
import { ScrollArea } from "../ui/scroll-area";

interface BatchEntryTableProps {
  datasetId: string;
  fields: FieldDefinition[];
  title: string;
  onSuccess?: () => void;
  maxBatchSize?: number;
}

export function BatchEntryTable({
  datasetId,
  fields,
  title,
  onSuccess,
  maxBatchSize = 50,
}: BatchEntryTableProps) {
  // Main state for entries
  const [entries, setEntries] = useState<Record<string, any>[]>([
    getEmptyEntry(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Submit all entries to the backend
  const submitEntries = async () => {
    if (entries.length === 0) {
      toast.error("No entries to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare entries for submission (remove temporary id)
      const entriesToSubmit = entries.map((entry) => {
        const rest = { ...entry };
        delete rest.id; // Remove the temporary ID for submission
        return rest;
      });

      // Use the importRecords API to batch import
      const count = await ApiService.importRecords(datasetId, entriesToSubmit);

      if (count > 0) {
        toast.success(`Successfully added ${count} ${title} records`);

        // Reset entries
        setEntries([getEmptyEntry()]);

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
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
    toast.info("All entries cleared");
  };

  // Handle CSV import
  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);

    try {
      // Parse the CSV file
      const parsedData = await parseCSV(file, fields);

      // Limit to max batch size
      const limitedData = parsedData.slice(0, maxBatchSize);

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

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) =>
              updateEntryField(entryIndex, field.key, e.target.value)
            }
            className="h-8 w-full"
          />
        );

      case "number":
      case "percentage":
        return (
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
        );

      case "boolean":
        return (
          <div className="flex justify-center">
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start text-left font-normal"
              >
                {value ? format(new Date(value), "PPP") : "Pick a date"}
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
        );

      default:
        return <span>{value}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title} Batch Entry</CardTitle>
        <div className="flex items-center gap-2">
          {/* CSV Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
              disabled={isSubmitting}
            />
          </Button>

          {/* Template Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={isSubmitting}
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>
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
              <ConfirmResetDialog onConfirm={clearEntries} />
            </div>
          </div>

          {/* Table of entries */}
          <div className="border rounded-md">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {fields.map((field) => (
                      <TableHead key={field.key} className="whitespace-nowrap">
                        {field.displayName}
                      </TableHead>
                    ))}
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {entries.map((entry, entryIndex) => (
                    <TableRow key={entry.id}>
                      {fields.map((field) => (
                        <TableCell key={`${entry.id}-${field.key}`}>
                          {renderCell(entry, field, entryIndex)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(entryIndex)}
                          disabled={entries.length <= 1 && entryIndex === 0}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={submitEntries}
              disabled={isSubmitting || entries.length === 0}
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

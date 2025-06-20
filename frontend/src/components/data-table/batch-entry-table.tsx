import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash, Loader2, ChevronRight } from "lucide-react";
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
import ReusableCard from "../reusable/reusable-card";
import {
  DuplicateDetectionDialog,
  DuplicateRecord,
} from "./duplicate-detection-dialog";

export function BatchEntryTable({
  datasetId,
  fields,
  title,
  onSuccess,
  maxBatchSize = 500,
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
  const storageKey = `batch_entry_${datasetId}`;

  const [entries, setEntries] = useState<Record<string, any>[]>([]);
  const [pendingEntries, setPendingEntries] = useState<Record<string, any>[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [duplicateCheckEntries, setDuplicateCheckEntries] = useState<
    Record<string, any>[]
  >([]);

  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  const totalEntries = entries.length + pendingEntries.length;
  const totalBatches = Math.ceil(totalEntries / maxBatchSize);
  const hasNextBatch = pendingEntries.length > 0;

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

  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem(storageKey);
      const savedPendingEntries = localStorage.getItem(`${storageKey}_pending`);

      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
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

        const hasRealData = hasNonEmptyEntries(processedEntries);
        setHasSavedData(hasRealData);

        if (hasRealData) {
          toast.info("Loaded saved entries from your previous session");
        } else {
          localStorage.removeItem(storageKey);
          setEntries([getEmptyEntry()]);
        }
      } else {
        setEntries([getEmptyEntry()]);
      }

      if (savedPendingEntries) {
        const parsedPendingEntries = JSON.parse(savedPendingEntries);
        const processedPendingEntries = parsedPendingEntries.map(
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
        setPendingEntries(processedPendingEntries);
      }
    } catch (error) {
      console.error("Error loading saved entries:", error);
      setEntries([getEmptyEntry()]);
      setPendingEntries([]);
    }
  }, [datasetId, fields]);

  const hasNonEmptyEntries = (entriesArray: Record<string, any>[]) => {
    if (entriesArray.length > 1) return true;

    if (entriesArray.length === 1) {
      const entry = entriesArray[0];

      for (const field of fields) {
        const value = entry[field.key];

        switch (field.type) {
          case "text":
            if (value && value.trim() !== "") return true;
            break;
          case "number":
          case "percentage":
            if (value !== 0 && value !== null && value !== undefined)
              return true;
            break;
          case "boolean":
            if (value === true) return true;
            break;
          case "select-single":
            if (field.options && field.options.length > 0) {
              const defaultValue = field.options[0].id;
              if (value && value !== defaultValue) return true;
            } else if (value && value.trim() !== "") {
              return true;
            }
            break;
          case "select-multiple":
            if (Array.isArray(value) && value.length > 0) {
              return true;
            }
            break;
          case "date":
            break;
        }
      }
    }

    return false;
  };

  useEffect(() => {
    if (entries.length > 0) {
      try {
        const hasData = hasNonEmptyEntries(entries);

        if (hasData) {
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
          localStorage.removeItem(storageKey);
          setHasSavedData(false);
        }
      } catch (error) {
        console.error("Error handling entries localStorage:", error);
      }
    }

    if (pendingEntries.length > 0) {
      try {
        const pendingEntriesToSave = pendingEntries.map((entry) => {
          const entryCopy = { ...entry };
          fields.forEach((field) => {
            if (field.type === "date" && entryCopy[field.key] instanceof Date) {
              entryCopy[field.key] = entryCopy[field.key].toISOString();
            }
          });
          return entryCopy;
        });
        localStorage.setItem(
          `${storageKey}_pending`,
          JSON.stringify(pendingEntriesToSave)
        );
      } catch (error) {
        console.error("Error handling pending entries localStorage:", error);
      }
    } else {
      localStorage.removeItem(`${storageKey}_pending`);
    }
  }, [entries, pendingEntries, datasetId, fields]);

  const loadNextBatch = useCallback(() => {
    if (pendingEntries.length === 0) return;

    const nextBatchSize = Math.min(maxBatchSize, pendingEntries.length);
    const nextBatch = pendingEntries.slice(0, nextBatchSize);
    const remainingPending = pendingEntries.slice(nextBatchSize);

    setEntries(nextBatch);
    setPendingEntries(remainingPending);
    setCurrentBatch(currentBatch + 1);

    toast.info(
      `Loaded batch ${currentBatch + 1} of ${totalBatches} (${nextBatch.length} entries)`
    );
  }, [pendingEntries, maxBatchSize, currentBatch, totalBatches]);

  const addEntry = () => {
    if (entries.length >= maxBatchSize) {
      toast.warning(
        `Maximum of ${maxBatchSize} entries allowed in a single batch`
      );
      return;
    }
    setEntries([...entries, getEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);

    if (newEntries.length === 0) {
      newEntries.push(getEmptyEntry());
    }

    setEntries(newEntries);
  };

  const updateEntryField = (
    entryIndex: number,
    fieldKey: string,
    value: any
  ) => {
    const newEntries = [...entries];
    newEntries[entryIndex] = { ...newEntries[entryIndex], [fieldKey]: value };
    setEntries(newEntries);
  };

  const resolveRelationRefs = async (entriesData: Record<string, any>[]) => {
    if (relationFields.length === 0) return entriesData;

    try {
      return await resolveRelationReferences(entriesData, fields);
    } catch (error) {
      console.error("Error resolving relation references:", error);
      return entriesData;
    }
  };

  const submitEntries = async () => {
    if (entries.length === 0) {
      toast.error("No entries to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      const processedEntries = await resolveRelationRefs(entries);

      const entriesToSubmit = processedEntries.map((entry) => {
        const rest = { ...entry };
        delete rest.id;
        return rest;
      });

      const duplicateResults = await ApiService.checkForDuplicates(
        datasetId,
        entriesToSubmit
      );

      if (duplicateResults.length > 0) {
        const formattedDuplicates: DuplicateRecord[] = duplicateResults.map(
          (result) => ({
            importRecord: result.importRecord,
            existingRecords: result.existingRecords,
            duplicateFields: result.duplicateFields,
            confidence: result.confidence,
            action: null,
          })
        );

        setDuplicates(formattedDuplicates);
        setDuplicateCheckEntries(processedEntries);
        setDuplicateDialogOpen(true);
        setIsSubmitting(false);
        return;
      }

      const count = await ApiService.importRecords(datasetId, entriesToSubmit);

      if (count > 0) {
        toast.success(`Successfully added ${count} ${title} records`);

        localStorage.removeItem(storageKey);
        setHasSavedData(false);

        await loadData();

        if (hasNextBatch) {
          loadNextBatch();
        } else {
          setEntries([getEmptyEntry()]);
          setCurrentBatch(1);

          if (onSuccess) {
            onSuccess();
          }

          if (onNavigateToTable) {
            onNavigateToTable();
          }
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

  const handleDuplicateResolution = async (
    resolutions: Record<number, "skip" | "create" | "overwrite">
  ) => {
    setIsSubmitting(true);
    setDuplicateDialogOpen(false);

    try {
      const recordsToImport: Record<string, any>[] = [];
      const processedIndices = new Set<number>();

      const entriesWithoutIds = duplicateCheckEntries.map((entry) => {
        const entryWithoutId = { ...entry };
        delete entryWithoutId.id;

        Object.keys(entryWithoutId).forEach((key) => {
          if (entryWithoutId[key] instanceof Date) {
            entryWithoutId[key] = entryWithoutId[key].toISOString();
          }
        });

        return entryWithoutId;
      });

      duplicates.forEach((duplicate, index) => {
        const resolution = resolutions[index];

        const entryIndex = entriesWithoutIds.findIndex((entryWithoutId) => {
          const sortedEntry = Object.keys(entryWithoutId)
            .sort()
            .reduce((obj, key) => {
              obj[key] = entryWithoutId[key];
              return obj;
            }, {} as any);

          const sortedDuplicate = Object.keys(duplicate.importRecord)
            .sort()
            .reduce((obj, key) => {
              obj[key] = duplicate.importRecord[key];
              return obj;
            }, {} as any);

          return (
            JSON.stringify(sortedEntry) === JSON.stringify(sortedDuplicate)
          );
        });

        if (entryIndex !== -1) {
          processedIndices.add(entryIndex);

          if (resolution === "create") {
            recordsToImport.push(duplicate.importRecord);
          }
        }
      });

      if (recordsToImport.length > 0) {
        const count = await ApiService.importRecords(
          datasetId,
          recordsToImport
        );

        if (count > 0) {
          toast.success(`Successfully added ${count} ${title} records`);

          localStorage.removeItem(storageKey);
          setHasSavedData(false);

          await loadData();
        }
      } else {
        toast.info("All records were skipped");
      }

      if (processedIndices.size === duplicateCheckEntries.length) {
        if (hasNextBatch) {
          loadNextBatch();
        } else {
          setEntries([getEmptyEntry()]);
          setCurrentBatch(1);

          if (onSuccess) {
            onSuccess();
          }

          if (onNavigateToTable) {
            onNavigateToTable();
          }
        }
      } else {
        const remainingEntries = entries.filter((entry) => {
          const checkIndex = duplicateCheckEntries.findIndex(
            (checkEntry) => checkEntry.id === entry.id
          );
          return checkIndex === -1 || !processedIndices.has(checkIndex);
        });

        if (remainingEntries.length === 0) {
          setEntries([getEmptyEntry()]);
        } else {
          setEntries(remainingEntries);
        }
      }
    } catch (error) {
      console.error("Error processing duplicate resolutions:", error);
      toast.error("Failed to process duplicate resolutions");
    } finally {
      setIsSubmitting(false);
      setDuplicates([]);
      setDuplicateCheckEntries([]);
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicateDialogOpen(false);
    setIsSubmitting(false);
    setDuplicates([]);
    setDuplicateCheckEntries([]);
  };

  const clearEntries = () => {
    setEntries([getEmptyEntry()]);
    setPendingEntries([]);
    setCurrentBatch(1);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_pending`);
    setHasSavedData(false);
    toast.info("All entries cleared");
  };

  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);

    try {
      const parsedData = await parseCSV(file, fields);

      const processedData = await resolveRelationRefs(parsedData);

      if (processedData.length > 0) {
        const currentBatchData = processedData.slice(0, maxBatchSize);
        const remainingData = processedData.slice(maxBatchSize);

        const dataWithIds = currentBatchData.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));

        const pendingDataWithIds = remainingData.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));

        setEntries(dataWithIds);
        setPendingEntries(pendingDataWithIds);
        setCurrentBatch(1);

        if (remainingData.length > 0) {
          const totalBatches = Math.ceil(processedData.length / maxBatchSize);
          toast.success(
            `Loaded ${processedData.length} records from CSV. Showing batch 1 of ${totalBatches} (${dataWithIds.length} entries). Submit this batch to continue with the next.`
          );
        } else {
          toast.success(`Loaded ${currentBatchData.length} records from CSV`);
        }
      } else {
        toast.error("No valid data found in CSV");
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsSubmitting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

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

  const renderCell = (
    entry: Record<string, any>,
    field: FieldDefinition,
    entryIndex: number
  ) => {
    const value = entry[field.key];

    const cellStyle = { minWidth: "80px", width: "100%" };

    if (field.isRelation && field.relatedDataset) {
      const options = generateOptionsForLoadRelationOptions(
        allData[field.relatedDataset as DataStoreName] || [],
        field
      );

      const displayValue = value === "" ? "_none_" : value || "_none_";

      const onValueChange = (newValue: string) => {
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
          <ReusableMultiSelect
            options={field.options || []}
            selected={value ? value : []}
            onChange={(values) =>
              updateEntryField(entryIndex, field.key, values)
            }
            title={field.displayName}
            className="min-w-[30rem]"
          />
        );
      default:
        return <span style={cellStyle}>{JSON.stringify(value)}</span>;
    }
  };

  return (
    <>
      <ReusableCard
        title={
          <div className="flex items-center gap-2">
            {title} Batch Entry
            {hasSavedData && <SavedDataBadge />}
          </div>
        }
        headerActions={
          <BatchEntryImportButtons
            fileInputRef={fileInputRef}
            isSubmitting={isSubmitting}
            handleImportCSV={handleImportCSV}
            handleDownloadTemplate={handleDownloadTemplate}
          />
        }
        content={
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </Badge>
                {totalBatches > 1 && (
                  <Badge variant="secondary">
                    Batch {currentBatch} of {totalBatches} ({totalEntries}{" "}
                    total)
                  </Badge>
                )}
                {hasNextBatch && (
                  <Badge variant="destructive">
                    {pendingEntries.length} pending
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEntry}
                  disabled={isSubmitting || entries.length >= maxBatchSize}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
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
            <div className="border rounded-md">
              <div className="overflow-auto max-h-[500px]">
                <div style={{ minWidth: "100%", overflowX: "auto" }}>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead
                          style={{ minWidth: "50px", width: "50px" }}
                        ></TableHead>
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
                                disabled={
                                  entries.length <= 1 && entryIndex === 0
                                }
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
            <div className="flex justify-between items-center">
              {hasNextBatch && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={loadNextBatch}
                    disabled={isSubmitting}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Load Next Batch (
                    {Math.min(maxBatchSize, pendingEntries.length)} entries)
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pendingEntries.length} entries remaining
                  </span>
                </div>
              )}
              <Button
                onClick={submitEntries}
                disabled={isSubmitting || entries.length === 0}
                className="bg-primary hover:bg-primary/90 ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit {hasNextBatch ? "Current Batch" : "All Entries"}
                  </>
                )}
              </Button>
            </div>
          </div>
        }
      />
      <DuplicateDetectionDialog
        isOpen={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        duplicates={duplicates}
        fields={fields}
        onResolve={handleDuplicateResolution}
        onCancel={handleDuplicateCancel}
      />
    </>
  );
}

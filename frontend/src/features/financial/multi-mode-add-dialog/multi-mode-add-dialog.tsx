import { useState, useRef } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import {
  FileText,
  List,
  Upload,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import { MultiModeAddDialogProps, AddMode, MultiEntryRow } from "./types";
import { DataStoreName, addEntry } from "@/store/data-store";
import MultiEntryTable from "./multi-entry-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseCSV, createCSVTemplate, validateCSV } from "@/lib/csv-parser";

export default function MultiModeAddDialog({
  open,
  onOpenChange,
  title,
  datasetId,
  fieldDefinitions,
  onSuccess,
  recentEntries = [],
  existingEntries = [],
  formatters = {},
  availableModes = ["single", "multiple", "bulk"],
}: MultiModeAddDialogProps) {
  const [mode, setMode] = useState<AddMode>(availableModes[0] || "single");
  const [multipleRows, setMultipleRows] = useState<MultiEntryRow[]>([]);
  const [bulkRows, setBulkRows] = useState<MultiEntryRow[]>([]);
  const [showRecentEntries, setShowRecentEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const singleFormSubmitRef = useRef<(() => void) | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const enhancedAutocompleteFields: Record<
    string,
    {
      displayFields: string[];
      autoFillFields: string[];
      usePortal?: boolean;
      dropdownPosition?: "top" | "bottom";
    }
  > =
    datasetId === "financial_logs"
      ? {
          description: {
            displayFields: ["category", "tags"],
            autoFillFields: ["category", "tags"],
            usePortal: true,
            dropdownPosition: "top" as const,
          },
          tags: {
            displayFields: [],
            autoFillFields: [],
            usePortal: true,
            dropdownPosition: "top" as const,
          },
        }
      : datasetId === "financial_balances"
        ? {
            account_name: {
              displayFields: ["account_type", "account_owner"],
              autoFillFields: ["account_type", "account_owner"],
              usePortal: true,
              dropdownPosition: "top" as const,
            },
          }
        : datasetId === "paycheck_info"
          ? {
              deduction_type: {
                displayFields: ["category"],
                autoFillFields: ["category"],
                usePortal: true,
                dropdownPosition: "top" as const,
              },
            }
          : {};

  const handleSingleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
    toast.success(`${title} added successfully`);
  };

  const processDataForSave = (data: Record<string, unknown>) => {
    const processed = { ...data };

    fieldDefinitions.forEach((field) => {
      if (field.type === "date" && processed[field.key]) {
        const dateValue = processed[field.key] as string;
        console.log(
          `Processing date field ${field.key}:`,
          dateValue,
          typeof dateValue
        );
        if (dateValue) {
          // Check if the date is already in ISO format
          if (dateValue.includes("T") || dateValue.includes("Z")) {
            // Already in ISO format, use as-is
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              processed[field.key] = date.toISOString();
            } else {
              console.error(`Invalid ISO date: ${dateValue}`);
              processed[field.key] = new Date().toISOString();
            }
          } else {
            // Assume it's a date string without time, create local date
            const localDate = new Date(dateValue + "T00:00:00");
            console.log(`Local date created:`, localDate);
            console.log(`ISO string:`, localDate.toISOString());
            if (!isNaN(localDate.getTime())) {
              processed[field.key] = localDate.toISOString();
            } else {
              console.error(`Invalid date: ${dateValue}`);
              processed[field.key] = new Date().toISOString();
            }
          }
        }
      }
    });

    return processed;
  };

  const handleMultipleSave = async () => {
    const validRows = multipleRows.filter((row) => row.isValid);
    const invalidRows = multipleRows.filter((row) => !row.isValid);

    if (validRows.length === 0) {
      toast.error(
        "No valid entries to save. Please fix the errors and try again."
      );
      return;
    }

    if (invalidRows.length > 0) {
      const confirmSave = window.confirm(
        `${invalidRows.length} row(s) have errors and will not be saved. Do you want to continue and save only the ${validRows.length} valid row(s)?`
      );
      if (!confirmSave) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const savedRows: string[] = [];
      const failedRows: MultiEntryRow[] = [];

      for (const row of validRows) {
        try {
          const processedData = processDataForSave(row.data);
          const savedRecord = await ApiService.addRecord(
            datasetId,
            processedData
          );
          if (savedRecord) {
            addEntry(savedRecord, datasetId as DataStoreName);
            savedRows.push(row.id);
          }
        } catch (error) {
          console.error(`Failed to save row ${row.id}:`, error);
          failedRows.push(row);
        }
      }

      const remainingRows = multipleRows.filter(
        (row) => !savedRows.includes(row.id)
      );

      if (savedRows.length > 0) {
        toast.success(
          `${savedRows.length} ${title} entries added successfully`
        );
        onSuccess?.();
      }

      if (failedRows.length > 0) {
        toast.error(
          `${failedRows.length} entries failed to save. Please try again.`
        );
      }

      if (remainingRows.length === 0) {
        onOpenChange(false);
        setMultipleRows([]);
      } else {
        setMultipleRows(remainingRows);
        toast.info(
          `${remainingRows.length} row(s) remaining. Fix errors and try again.`
        );
      }
    } catch (error) {
      toast.error("Failed to save entries");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const validRows = bulkRows.filter((row) => row.isValid);
    const invalidRows = bulkRows.filter((row) => !row.isValid);

    if (validRows.length === 0) {
      toast.error(
        "No valid entries to save. Please fix the errors and try again."
      );
      return;
    }

    if (invalidRows.length > 0) {
      const confirmSave = window.confirm(
        `${invalidRows.length} row(s) have errors and will not be saved. Do you want to continue and save only the ${validRows.length} valid row(s)?`
      );
      if (!confirmSave) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const savedRows: string[] = [];
      const failedRows: MultiEntryRow[] = [];

      for (const row of validRows) {
        try {
          const processedData = processDataForSave(row.data);
          const savedRecord = await ApiService.addRecord(
            datasetId,
            processedData
          );
          if (savedRecord) {
            addEntry(savedRecord, datasetId as DataStoreName);
            savedRows.push(row.id);
          }
        } catch (error) {
          console.error(`Failed to save row ${row.id}:`, error);
          failedRows.push(row);
        }
      }

      const remainingRows = bulkRows.filter(
        (row) => !savedRows.includes(row.id)
      );

      if (savedRows.length > 0) {
        toast.success(
          `${savedRows.length} ${title} entries added successfully`
        );
        onSuccess?.();
      }

      if (failedRows.length > 0) {
        toast.error(
          `${failedRows.length} entries failed to save. Please try again.`
        );
      }

      if (remainingRows.length === 0) {
        onOpenChange(false);
        setBulkRows([]);
      } else {
        setBulkRows(remainingRows);
        toast.info(
          `${remainingRows.length} row(s) remaining. Fix errors and try again.`
        );
      }
    } catch (error) {
      toast.error("Failed to save entries");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCSVFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);

    try {
      const validation = await validateCSV(
        file,
        fieldDefinitions.map((f) => f.key)
      );

      if (!validation.isValid) {
        toast.error("CSV validation failed", {
          description: `Missing required columns: ${validation.missingFields.join(", ")}`,
        });
        return;
      }

      const parsedData = await parseCSV(file, fieldDefinitions);

      const csvRows: MultiEntryRow[] = parsedData.map((data) => ({
        id: crypto.randomUUID(),
        data,
        isValid: true,
        errors: {},
      }));

      setBulkRows(csvRows);

      toast.success("CSV imported successfully", {
        description: `Loaded ${csvRows.length} entries`,
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Failed to import CSV file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploadingCSV(false);

      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const csvContent = createCSVTemplate(fieldDefinitions);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${datasetId}_template.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const formatValue = (
    value: unknown,
    field: string,
    record: Record<string, unknown>
  ): string => {
    if (formatters[field]) {
      const formatted = formatters[field](value, record);
      if (typeof formatted === "string") return formatted;
      return String(value || "");
    }

    const fieldDef = fieldDefinitions.find((f) => f.key === field);
    if (!fieldDef) return String(value || "");

    if (fieldDef.unit === "$") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(0);
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(numValue);
    }

    if (fieldDef.type === "date") {
      return formatDate(value as string);
    }

    return String(value || "");
  };

  const tabs = [
    {
      id: "single",
      label: "Single Entry",
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="p-4">
          <DataForm
            fields={fieldDefinitions}
            datasetId={datasetId as DataStoreName}
            onSuccess={handleSingleSuccess}
            existingEntries={existingEntries}
            enhancedAutocompleteFields={enhancedAutocompleteFields}
            renderFooter={({ handleSubmit }) => {
              singleFormSubmitRef.current = handleSubmit;
              return null;
            }}
          />
        </div>
      ),
    },
    {
      id: "multiple",
      label: "Multiple Entries",
      icon: <List className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add multiple entries at once using the table below. All valid
              entries will be saved.
            </AlertDescription>
          </Alert>
          <MultiEntryTable
            fieldDefinitions={fieldDefinitions}
            rows={multipleRows}
            onRowsChange={setMultipleRows}
            existingEntries={existingEntries}
            enhancedAutocompleteFields={enhancedAutocompleteFields}
          />
        </div>
      ),
    },
    {
      id: "bulk",
      label: "Bulk Import",
      icon: <Upload className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Alert className="flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bulk import multiple entries using CSV or manual entry. You can
                view recent entries for reference.
              </AlertDescription>
            </Alert>
            {recentEntries.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Switch
                  id="show-recent"
                  checked={showRecentEntries}
                  onCheckedChange={setShowRecentEntries}
                />
                <Label
                  htmlFor="show-recent"
                  className="flex items-center gap-2"
                >
                  {showRecentEntries ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  Recent Entries
                </Label>
              </div>
            )}
          </div>

          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-medium">CSV Import</h4>
            <p className="text-sm text-muted-foreground">
              Import data from a CSV file. Download the template to see the
              expected format.
            </p>
            <div className="flex gap-2">
              <input
                type="file"
                ref={csvFileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleCSVFileSelect}
                disabled={isUploadingCSV}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvFileInputRef.current?.click()}
                disabled={isUploadingCSV}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploadingCSV ? "Importing..." : "Import CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {showRecentEntries && recentEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Recent Entries (View Only)
              </h4>
              <div className="rounded-md border p-2 max-h-[200px] overflow-y-auto bg-muted/30">
                <div className="space-y-1">
                  {recentEntries
                    .sort((a, b) => {
                      const dateField = fieldDefinitions.find(
                        (f) => f.type === "date"
                      )?.key;
                      if (!dateField) return 0;
                      const dateA = new Date(a[dateField] as string);
                      const dateB = new Date(b[dateField] as string);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 10)
                    .map((entry, index) => (
                      <div
                        key={entry.id || index}
                        className={cn(
                          "text-sm p-2 rounded",
                          index % 2 === 0 ? "bg-background" : "bg-muted/50"
                        )}
                      >
                        {fieldDefinitions
                          .filter(
                            (f) =>
                              !f.isRelation && f.key !== "id" && entry[f.key]
                          )
                          .map((field, i) => (
                            <span key={field.key}>
                              {i > 0 && " • "}
                              <span className="font-medium">
                                {field.displayName}:
                              </span>{" "}
                              {formatValue(entry[field.key], field.key, entry)}
                            </span>
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">New Entries</h4>
            <MultiEntryTable
              fieldDefinitions={fieldDefinitions}
              rows={bulkRows}
              onRowsChange={setBulkRows}
              existingEntries={existingEntries}
              enhancedAutocompleteFields={enhancedAutocompleteFields}
            />
          </div>
        </div>
      ),
    },
  ];

  const filteredTabs = tabs.filter((tab) =>
    availableModes.includes(tab.id as AddMode)
  );

  const getFooterActions = () => {
    if (mode === "single") {
      return (
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => singleFormSubmitRef.current?.()}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </>
      );
    } else if (mode === "multiple") {
      const validCount = multipleRows.filter((r) => r.isValid).length;
      return (
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMultipleSave}
            disabled={isSaving || validCount === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save {validCount} Valid {validCount === 1 ? "Entry" : "Entries"}
          </Button>
        </>
      );
    } else if (mode === "bulk") {
      const validCount = bulkRows.filter((r) => r.isValid).length;
      return (
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkSave}
            disabled={isSaving || validCount === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Import {validCount} Valid {validCount === 1 ? "Entry" : "Entries"}
          </Button>
        </>
      );
    }
    return null;
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add ${title}`}
      showTrigger={false}
      fixedFooter={true}
      customFooter={
        <div className="flex justify-end gap-2">{getFooterActions()}</div>
      }
      customContent={
        <div className="w-full">
          {filteredTabs.length === 1 ? (
            filteredTabs[0].content
          ) : (
            <ReusableTabs
              tabs={filteredTabs}
              defaultTabId={mode}
              onChange={(tabId) => setMode(tabId as AddMode)}
              className="w-full"
            />
          )}
        </div>
      }
      contentClassName="max-w-[95vw] w-full"
    />
  );
}

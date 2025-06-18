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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import { MultiModeAddDialogProps, AddMode, MultiEntryRow } from "./types";
import { DataStoreName } from "@/store/data-store";
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

  const handleMultipleSave = async () => {
    const validRows = multipleRows.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error("No valid entries to save");
      return;
    }

    if (validRows.length < multipleRows.length) {
      const invalidCount = multipleRows.length - validRows.length;
      toast.warning(`${invalidCount} invalid row(s) will be skipped`);
    }

    setIsSaving(true);
    try {
      for (const row of validRows) {
        await ApiService.addRecord(datasetId, row.data);
      }

      toast.success(`${validRows.length} ${title} entries added successfully`);
      onSuccess?.();
      onOpenChange(false);
      setMultipleRows([]);
    } catch (error) {
      toast.error("Failed to save entries");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const validRows = bulkRows.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error("No valid entries to save");
      return;
    }

    if (validRows.length < bulkRows.length) {
      const invalidCount = bulkRows.length - validRows.length;
      toast.warning(`${invalidCount} invalid row(s) will be skipped`);
    }

    setIsSaving(true);
    try {
      for (const row of validRows) {
        await ApiService.addRecord(datasetId, row.data);
      }

      toast.success(`${validRows.length} ${title} entries added successfully`);
      onSuccess?.();
      onOpenChange(false);
      setBulkRows([]);
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

      setBulkRows((prev) => [...prev, ...csvRows]);

      toast.success("CSV imported successfully", {
        description: `Added ${csvRows.length} entries to the table`,
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
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number(value) || 0);
    }

    if (fieldDef.type === "date") {
      return format(new Date(value as string), "MMM d, yyyy");
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

          {/* CSV Import Section */}
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
                  {recentEntries.slice(0, 10).map((entry, index) => (
                    <div
                      key={entry.id || index}
                      className={cn(
                        "text-sm p-2 rounded",
                        index % 2 === 0 ? "bg-background" : "bg-muted/50"
                      )}
                    >
                      {fieldDefinitions
                        .filter(
                          (f) => !f.isRelation && f.key !== "id" && entry[f.key]
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

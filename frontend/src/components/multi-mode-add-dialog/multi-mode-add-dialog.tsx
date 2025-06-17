import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import { MultiModeAddDialogProps, AddMode, MultiEntryRow } from "./types";
import { DataStoreName } from "@/store/data-store";
import MultiEntryTable from "./multi-entry-table";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
}: MultiModeAddDialogProps) {
  const [mode, setMode] = useState<AddMode>("single");
  const [multipleRows, setMultipleRows] = useState<MultiEntryRow[]>([]);
  const [bulkRows, setBulkRows] = useState<MultiEntryRow[]>([]);
  const [showRecentEntries, setShowRecentEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Enhanced autocomplete configuration
  const enhancedAutocompleteFields: Record<string, {
    displayFields: string[];
    autoFillFields: string[];
    usePortal?: boolean;
    dropdownPosition?: "top" | "bottom";
  }> = datasetId === "financial_logs" ? {
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
    }
  } : datasetId === "financial_balances" ? {
    account_name: {
      displayFields: ["account_type", "account_owner"],
      autoFillFields: ["account_type", "account_owner"],
      usePortal: true,
      dropdownPosition: "top" as const,
    }
  } : datasetId === "paycheck_info" ? {
    deduction_type: {
      displayFields: ["category"],
      autoFillFields: ["category"],
      usePortal: true,
      dropdownPosition: "top" as const,
    }
  } : {};

  const handleSingleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
    toast.success(`${title} added successfully`);
  };

  const handleMultipleSave = async () => {
    // Validate all rows
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
      // Save all valid rows
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
    // Validate all rows
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
      // Save all valid rows
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

  const formatValue = (value: unknown, field: string, record: Record<string, unknown>): string => {
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
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMultipleSave}
              disabled={
                isSaving || multipleRows.filter((r) => r.isValid).length === 0
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Save {multipleRows.filter((r) => r.isValid).length} Valid Entries
            </Button>
          </div>
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
                Bulk import multiple entries. You can view recent entries for
                reference.
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={
                isSaving || bulkRows.filter((r) => r.isValid).length === 0
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Import {bulkRows.filter((r) => r.isValid).length} Valid Entries
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add ${title}`}
      showTrigger={false}
      customFooter={<div />}
      customContent={
        <div className="w-full max-h-[80vh] overflow-y-auto pr-4">
          <ReusableTabs
            tabs={tabs}
            defaultTabId={mode}
            onChange={(tabId) => setMode(tabId as AddMode)}
            className="w-full"
          />
        </div>
      }
      contentClassName="max-w-[95vw] w-full"
    />
  );
}

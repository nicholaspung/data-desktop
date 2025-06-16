import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, X, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { FieldDefinition } from "@/types/types";

export interface DuplicateRecord {
  importRecord: Record<string, any>;
  existingRecords: Record<string, any>[];
  duplicateFields: string[];
  confidence: number; // 0-1 score
  action: "skip" | "create" | "overwrite" | null;
}

interface DuplicateDetectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateRecord[];
  fields: FieldDefinition[];
  onResolve: (
    resolutions: Record<number, "skip" | "create" | "overwrite">
  ) => void;
  onCancel: () => void;
}

export function DuplicateDetectionDialog({
  isOpen,
  onOpenChange,
  duplicates,
  fields,
  onResolve,
  onCancel,
}: DuplicateDetectionDialogProps) {
  const [resolutions, setResolutions] = useState<
    Record<number, "skip" | "create" | "overwrite">
  >({});
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);

  const handleResolutionChange = (
    index: number,
    action: "skip" | "create" | "overwrite"
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [index]: action,
    }));
  };

  const applyGlobalAction = (action: "skip" | "create" | "overwrite") => {
    const newResolutions: Record<number, "skip" | "create" | "overwrite"> = {};
    duplicates.forEach((_, index) => {
      newResolutions[index] = action;
    });
    setResolutions(newResolutions);
  };

  const handleResolve = () => {
    onResolve(resolutions);
  };

  const getFieldDisplayValue = (
    record: Record<string, unknown>,
    fieldKey: string
  ) => {
    const field = fields.find((f) => f.key === fieldKey);
    const value = record[fieldKey];

    if (field?.type === "date" && value) {
      return new Date(value as string | number | Date).toLocaleDateString();
    }

    return value?.toString() || "—";
  };

  const resolvedCount = Object.keys(resolutions).length;
  const allResolved = resolvedCount === duplicates.length;

  const renderRecordComparison = (
    duplicate: DuplicateRecord,
    index: number
  ) => {
    const { importRecord, existingRecords, duplicateFields, confidence } =
      duplicate;
    const currentResolution = resolutions[index];

    return (
      <div key={index} className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-medium">
              Potential Duplicate #{index + 1}
            </span>
            <Badge variant={confidence > 0.8 ? "destructive" : "secondary"}>
              {Math.round(confidence * 100)}% match
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setSelectedRecord(selectedRecord === index ? null : index)
            }
          >
            <Eye className="h-4 w-4" />
            {selectedRecord === index ? "Hide Details" : "View Details"}
          </Button>
        </div>

        {selectedRecord === index && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Import Record</h4>
                <div className="space-y-1 text-sm">
                  {duplicateFields.map((fieldKey) => (
                    <div key={fieldKey} className="flex justify-between">
                      <span className="text-muted-foreground">{fieldKey}:</span>
                      <span className="font-medium">
                        {getFieldDisplayValue(importRecord, fieldKey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">
                  Existing Records ({existingRecords.length})
                </h4>
                <ScrollArea className="h-24">
                  {existingRecords.map((existing, idx) => (
                    <div
                      key={idx}
                      className="space-y-1 text-sm mb-2 p-2 bg-muted rounded"
                    >
                      {duplicateFields.map((fieldKey) => (
                        <div key={fieldKey} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {fieldKey}:
                          </span>
                          <span className="font-medium">
                            {getFieldDisplayValue(existing, fieldKey)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Action:</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={currentResolution === "skip"}
                onCheckedChange={(checked) => {
                  if (checked) handleResolutionChange(index, "skip");
                }}
              />
              <span className="text-sm">Skip</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={currentResolution === "create"}
                onCheckedChange={(checked) => {
                  if (checked) handleResolutionChange(index, "create");
                }}
              />
              <span className="text-sm">Create Anyway</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={currentResolution === "overwrite"}
                onCheckedChange={(checked) => {
                  if (checked) handleResolutionChange(index, "overwrite");
                }}
              />
              <span className="text-sm">Overwrite Existing</span>
            </label>
          </div>
        </div>

        {currentResolution && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Check className="h-4 w-4" />
            <AlertDescription>
              {currentResolution === "skip" && "This record will be skipped"}
              {currentResolution === "create" &&
                "This record will be created as a new entry"}
              {currentResolution === "overwrite" &&
                "This record will overwrite the existing record(s)"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderDialogContent = () => (
    <div className="flex flex-col max-h-[70vh] overflow-hidden">
      <div className="space-y-4 pb-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {duplicates.length} potential duplicate record(s). Please
            choose how to handle each one.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Global Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyGlobalAction("skip")}
              >
                Skip All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyGlobalAction("create")}
              >
                Create All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyGlobalAction("overwrite")}
              >
                Overwrite All
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Resolved: {resolvedCount} / {duplicates.length}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 pr-4 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {duplicates.map((duplicate, index) =>
            renderRecordComparison(duplicate, index)
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderDialogFooter = () => (
    <div className="flex justify-between w-full">
      <Button variant="ghost" onClick={onCancel}>
        <X className="mr-2 h-4 w-4" />
        Cancel Import
      </Button>
      <Button
        onClick={handleResolve}
        disabled={!allResolved}
        className={allResolved ? "bg-green-600 hover:bg-green-700" : ""}
      >
        <Check className="mr-2 h-4 w-4" />
        Apply Resolutions ({resolvedCount}/{duplicates.length})
      </Button>
    </div>
  );

  return (
    <ReusableDialog
      title="Duplicate Records Detected"
      description="Review and resolve potential duplicate records before importing."
      open={isOpen}
      onOpenChange={onOpenChange}
      showTrigger={false}
      customContent={renderDialogContent()}
      customFooter={renderDialogFooter()}
      contentClassName="max-w-4xl max-h-[90vh] overflow-hidden"
    />
  );
}

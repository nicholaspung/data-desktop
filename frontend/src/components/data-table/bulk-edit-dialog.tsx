// src/components/data-table/bulk-edit-dialog.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Edit,
} from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { FieldDefinition } from "@/types/types";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { DataStoreName, updateEntry } from "@/store/data-store";
import DataForm from "@/components/data-form/data-form";
import { Badge } from "@/components/ui/badge";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRecords: Record<string, any>[];
  fields: FieldDefinition[];
  datasetId: DataStoreName;
  onDataChange?: () => void;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedRecords,
  fields,
  datasetId,
  onDataChange,
}: BulkEditDialogProps) {
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modifiedRecords, setModifiedRecords] = useState<Record<string, any>[]>(
    []
  );
  const [recordData, setRecordData] = useState<Record<string, any> | null>(
    null
  );
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when dialog opens or records change
  useEffect(() => {
    if (open && selectedRecords.length > 0) {
      setCurrentRecordIndex(0);
      setModifiedRecords([]);
      setIsComplete(false);
      setRecordData(selectedRecords[0]);
    }
  }, [open, selectedRecords]);

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (!recordData) return;

    setIsSubmitting(true);

    try {
      const recordId = recordData.id;

      // Submit the update
      const response = await ApiService.updateRecord(recordId, data);

      if (response) {
        // Update the store
        updateEntry(recordId, response, datasetId);

        // Add to modified records list
        setModifiedRecords((prev) => [...prev, response]);

        // Move to next record or complete
        if (currentRecordIndex < selectedRecords.length - 1) {
          setCurrentRecordIndex(currentRecordIndex + 1);
          setRecordData(selectedRecords[currentRecordIndex + 1]);
        } else {
          setIsComplete(true);
        }

        toast.success("Record updated successfully");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentRecordIndex < selectedRecords.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
      setRecordData(selectedRecords[currentRecordIndex + 1]);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentRecordIndex > 0) {
      setCurrentRecordIndex(currentRecordIndex - 1);
      setRecordData(selectedRecords[currentRecordIndex - 1]);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    if (onDataChange) {
      onDataChange();
    }
  };

  // Summary screen when all records are processed
  const renderSummary = () => (
    <div className="py-6 space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium mb-2">Bulk Edit Complete</h3>
        <p className="text-muted-foreground">
          {modifiedRecords.length === 0
            ? "No records were modified."
            : `${modifiedRecords.length} out of ${selectedRecords.length} records were modified.`}
        </p>
      </div>

      {modifiedRecords.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Modified Records:</h4>
          <div className="max-h-80 overflow-y-auto border rounded-md p-4">
            {modifiedRecords.map((record, index) => {
              const nameField = fields.find(
                (f) =>
                  f.key === "name" ||
                  f.displayName.toLowerCase().includes("name")
              );
              const titleField = fields.find(
                (f) =>
                  f.key === "title" ||
                  f.displayName.toLowerCase().includes("title")
              );
              const dateField = fields.find((f) => f.type === "date");

              let displayName = "";

              if (nameField && record[nameField.key]) {
                displayName = record[nameField.key];
              } else if (titleField && record[titleField.key]) {
                displayName = record[titleField.key];
              } else if (dateField && record[dateField.key]) {
                displayName = new Date(
                  record[dateField.key]
                ).toLocaleDateString();
              } else {
                displayName = `Record #${index + 1}`;
              }

              return (
                <div key={record.id} className="py-2 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{displayName}</span>
                    <Badge
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900"
                    >
                      Modified
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleComplete}>
          <Check className="mr-2 h-4 w-4" />
          Finish
        </Button>
      </div>
    </div>
  );

  // Progress indicator
  const progressBar = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          Record {currentRecordIndex + 1} of {selectedRecords.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {Math.round((currentRecordIndex / selectedRecords.length) * 100)}%
          complete
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentRecordIndex === 0 || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Skip <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  return (
    <ReusableDialog
      title={isComplete ? "Bulk Edit Results" : "Bulk Edit Records"}
      description={
        isComplete
          ? "Summary of your bulk edit operation"
          : `Edit selected records one by one (${selectedRecords.length} records selected)`
      }
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen);
        }
      }}
      triggerText="Bulk Edit Selected"
      triggerIcon={<Edit className="h-4 w-4 mr-2" />}
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      customContent={
        isComplete ? (
          renderSummary()
        ) : (
          <div className="py-4">
            {progressBar}

            {recordData && (
              <DataForm
                fields={fields}
                datasetId={datasetId}
                initialData={recordData}
                onSubmit={handleFormSubmit}
                submitLabel="Save & Next"
                showHeader={false}
                showSubmitButton={true}
                isSubmitting={isSubmitting}
                useInlineLayout={false}
                hideResetButton={true}
              />
            )}
          </div>
        )
      }
      customFooter={
        isComplete ? (
          <Button onClick={handleComplete}>Close</Button>
        ) : (
          <div className="flex justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  // Trigger form submit by finding the submit button and clicking it
                  const submitButton = document.querySelector(
                    'button[type="submit"]'
                  );
                  if (submitButton instanceof HTMLButtonElement) {
                    submitButton.click();
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Next
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      }
    />
  );
}

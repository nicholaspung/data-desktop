import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { FieldDefinition } from "@/types/types";
import { DataStoreName } from "@/store/data-store";
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
  const [modifiedRecords, setModifiedRecords] = useState<Record<string, any>[]>(
    []
  );
  const [recordData, setRecordData] = useState<Record<string, any> | null>(
    null
  );
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formKey, setFormKey] = useState(0); // Add a key state to force form re-render

  // Reset state when dialog opens or records change
  useEffect(() => {
    if (open && selectedRecords.length > 0) {
      setCurrentRecordIndex(0);
      setModifiedRecords([]);
      setIsComplete(false);
      setRecordData(selectedRecords[0]);
      setFormKey((prev) => prev + 1); // Increment form key to force re-render
    }
  }, [open]);

  // Update recordData whenever currentRecordIndex changes
  useEffect(() => {
    if (
      selectedRecords.length > 0 &&
      currentRecordIndex < selectedRecords.length
    ) {
      setRecordData(selectedRecords[currentRecordIndex]);
      setFormKey((prev) => prev + 1); // Increment form key to force re-render
    }
  }, [currentRecordIndex, selectedRecords]);

  const handleSkip = () => {
    if (currentRecordIndex < selectedRecords.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
      // recordData will be updated by the useEffect
    } else {
      setIsComplete(true);
    }
  };

  const handleSuccessfulEdit = (recordId: string) => {
    setIsProcessing(true);

    // Find the updated record from the id
    const updatedRecord = selectedRecords.find(
      (record) => record.id === recordId
    );

    if (updatedRecord) {
      // Add to modified records list
      setModifiedRecords((prev) => [...prev, updatedRecord]);
    }

    handleSkip();

    setIsProcessing(false);
  };

  const handlePrevious = () => {
    if (currentRecordIndex > 0) {
      setCurrentRecordIndex(currentRecordIndex - 1);
      // recordData will be updated by the useEffect
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
          disabled={currentRecordIndex === 0 || isProcessing}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          disabled={isProcessing}
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
        if (!isProcessing) {
          onOpenChange(newOpen);
        }
      }}
      triggerText="Bulk Edit Selected"
      triggerIcon={<Edit className="h-4 w-4 mr-2" />}
      triggerClassName="bg-yellow-500 dark:bg-yellow-600 text-white hover:bg-yellow-600 dark:hover:bg-yellow-700 focus:ring-yellow-500 focus:ring-offset-yellow-200"
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      customContent={
        isComplete ? (
          renderSummary()
        ) : (
          <div className="py-4">
            {progressBar}

            {recordData && (
              <DataForm
                key={`edit-form-${formKey}`} // Use the formKey state to force re-render
                fields={fields}
                datasetId={datasetId}
                initialValues={recordData}
                onSuccess={handleSuccessfulEdit}
                submitLabel="Save & Next"
                mode="edit"
                recordId={recordData.id}
              />
            )}
          </div>
        )
      }
      customFooter={<div />}
    />
  );
}

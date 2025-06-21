import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download } from "lucide-react";
import { BODY_MEASUREMENTS_FIELD_DEFINITIONS } from "@/features/field-definitions/body-measurements-definitions";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { parseCSV } from "@/lib/csv-parser";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useLoadData from "@/hooks/useLoadData";

const BodyMeasurementsCSVImport = () => {
  const [showWeightImportDialog, setShowWeightImportDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadData } = useLoadData({
    fields: BODY_MEASUREMENTS_FIELD_DEFINITIONS.fields,
    datasetId: "body_measurements",
    title: "Body Measurements",
  });

  const handleWeightCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Create minimal field definitions for weight import
      const weightFields = [
        {
          key: "date",
          type: "date" as const,
          displayName: "Date",
          datasetId: "body_measurements",
        },
        {
          key: "weight",
          type: "number" as const,
          displayName: "Weight",
          datasetId: "body_measurements",
        },
      ];

      const data = await parseCSV(file, weightFields);

      if (!data || data.length === 0) {
        toast.error("No valid data found in CSV file");
        return;
      }

      // Store the parsed data for confirmation
      setParsedData(data);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    try {
      // Transform weight data to body measurement format
      const transformedData = parsedData.map((record: Record<string, any>) => ({
        date: record.date,
        measurement: "Weight",
        value: record.weight,
        unit: "lbs",
      }));

      // Import the data
      const importedCount = await ApiService.importRecords(
        "body_measurements",
        transformedData
      );

      toast.success(
        `Successfully imported ${importedCount} weight measurement${importedCount !== 1 ? "s" : ""}`
      );

      // Reload data
      await loadData();

      // Reset state
      setParsedData(null);
      setShowWeightImportDialog(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing weight CSV:", error);
      toast.error("Failed to import weight measurements");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setShowWeightImportDialog(open);
    if (!open) {
      // Reset state when dialog closes
      setParsedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadWeightTemplate = () => {
    const csvContent = "date,weight\n2024-01-01,150\n2024-01-02,149.5";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "body_weight_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        onClick={() => setShowWeightImportDialog(true)}
        variant="outline"
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Import Weight CSV
      </Button>

      {/* Weight Import Dialog */}
      <ReusableDialog
        open={showWeightImportDialog}
        onOpenChange={handleDialogClose}
        title="Import Weight Measurements"
        description={
          parsedData
            ? `Found ${parsedData.length} weight entries`
            : "Upload a CSV file with date and weight columns"
        }
        customContent={
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {parsedData ? (
                  <div className="space-y-2">
                    <p>
                      Ready to import {parsedData.length} weight measurement
                      {parsedData.length !== 1 ? "s" : ""}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      All entries will be imported as "Weight" measurements in
                      lbs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>Upload a CSV file with two columns:</p>
                    <ul className="list-disc pl-5 text-sm">
                      <li>
                        <strong>date</strong>: Measurement date (YYYY-MM-DD)
                      </li>
                      <li>
                        <strong>weight</strong>: Weight value (will use lbs as
                        unit)
                      </li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {!parsedData && (
              <div className="flex gap-2">
                <Button
                  onClick={downloadWeightTemplate}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleWeightCSVUpload}
              className="hidden"
            />
          </div>
        }
        customFooter={
          parsedData ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmImport}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing
                  ? "Importing..."
                  : `Import ${parsedData.length} entries`}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? "Processing..." : "Select CSV File"}
            </Button>
          )
        }
        showTrigger={false}
      />
    </>
  );
};

export default BodyMeasurementsCSVImport;

// src/features/dexa/dexa-import.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Upload,
  FileDown,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useFieldDefinitions } from "../field-definitions/field-definitions-store";
import { parseCSV, createCSVTemplate, validateCSV } from "@/lib/csv-parser";
import { ApiService } from "@/services/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface DexaImportProps {
  onImportSuccess?: () => void;
}

export default function DexaImport({ onImportSuccess }: DexaImportProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status:
      | "idle"
      | "validating"
      | "parsing"
      | "importing"
      | "success"
      | "error";
    message: string;
    importCount?: number;
  }>({ status: "idle", message: "" });

  // Generate a template CSV for users to download
  const handleDownloadTemplate = () => {
    // Create the CSV template
    const csvContent = createCSVTemplate(dexaFields);

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dexa_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file selection and upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress({
      status: "validating",
      message: "Validating CSV format...",
    });

    try {
      // Check if the file is actually a CSV
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadProgress({
          status: "error",
          message: "Please upload a CSV file (.csv)",
        });
        return;
      }

      // First, validate that the CSV has the expected columns
      const requiredFields = dexaFields.map((field) => field.key);

      setUploadProgress({
        status: "validating",
        message: "Checking required columns...",
      });

      try {
        const validation = await validateCSV(file, requiredFields);

        if (!validation.isValid) {
          const missingFields = validation.missingFields.slice(0, 5); // Show first 5 missing fields
          const additionalCount = validation.missingFields.length - 5;

          const message = `CSV is missing required columns: ${missingFields.join(", ")}${
            additionalCount > 0 ? ` and ${additionalCount} more...` : ""
          }`;

          setUploadProgress({
            status: "error",
            message,
          });
          return;
        }
      } catch (validationError) {
        console.error("CSV validation error:", validationError);
        setUploadProgress({
          status: "error",
          message: "Invalid CSV format. Please check your file.",
        });
        return;
      }

      // Parse the CSV file
      setUploadProgress({ status: "parsing", message: "Parsing CSV data..." });

      let parsedData;
      try {
        parsedData = await parseCSV(file, dexaFields);

        if (!parsedData || parsedData.length === 0) {
          setUploadProgress({
            status: "error",
            message: "No valid data found in the CSV file.",
          });
          return;
        }
      } catch (parseError) {
        console.error("CSV parsing error:", parseError);
        setUploadProgress({
          status: "error",
          message: "Failed to parse CSV data. Please check the format.",
        });
        return;
      }

      // Import the data
      setUploadProgress({
        status: "importing",
        message: `Importing ${parsedData.length} DEXA scan records...`,
      });

      // Ensure we have a valid dataset ID before importing
      try {
        const dataset = await ApiService.getDataset("dexa");
        if (!dataset) {
          setUploadProgress({
            status: "error",
            message: "DEXA dataset not found. Please restart the application.",
          });
          return;
        }

        const count = await ApiService.importRecords("dexa", parsedData);

        if (count === 0) {
          setUploadProgress({
            status: "error",
            message: "No records were imported. Please check your CSV file.",
          });
          return;
        }

        // Success
        setUploadProgress({
          status: "success",
          message: "Import completed successfully",
          importCount: count,
        });

        toast.success(`Successfully imported ${count} DEXA scan records`);

        if (onImportSuccess) {
          onImportSuccess();
        }
      } catch (importError) {
        console.error("Import error:", importError);
        setUploadProgress({
          status: "error",
          message: "Failed to import data to the database.",
        });
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      setUploadProgress({
        status: "error",
        message: "Failed to import CSV. Please check the format and try again.",
      });
      toast.error("Import failed. Please check the CSV format and try again.");
    } finally {
      setIsUploading(false);

      // Clear the file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import DEXA Scan Data</CardTitle>
        <CardDescription>
          Upload a CSV file with your DEXA scan data or download a template to
          get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>To import multiple DEXA scans at once:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Download the template CSV using the button below</li>
            <li>Fill in your DEXA scan data in the spreadsheet</li>
            <li>Save the file as CSV and upload it</li>
          </ol>
        </div>

        <Separator />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Download Template
          </Button>

          <Button
            variant="default"
            className="relative cursor-pointer"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </>
            )}
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </Button>
        </div>

        {/* Progress/Status Display */}
        {uploadProgress.status !== "idle" && (
          <Alert
            variant={
              uploadProgress.status === "error"
                ? "destructive"
                : uploadProgress.status === "success"
                  ? "default"
                  : "default"
            }
          >
            {uploadProgress.status === "error" && (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            {uploadProgress.status === "success" && (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {(uploadProgress.status === "validating" ||
              uploadProgress.status === "parsing" ||
              uploadProgress.status === "importing") && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <AlertDescription>
              {uploadProgress.message}
              {uploadProgress.importCount && (
                <span className="font-semibold">
                  {" "}
                  ({uploadProgress.importCount} records)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

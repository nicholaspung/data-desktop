import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, AlertTriangle, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { parseCSV, createCSVTemplate, validateCSV } from "@/lib/csv-parser";
import { FieldDefinition } from "@/types/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DataStoreName } from "@/store/data-store";
import useLoadData from "@/hooks/useLoadData";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableCard from "@/components/reusable/reusable-card";

export function CSVImportProcessor({
  datasetId,
  fields,
  title,
  onSuccess,
  chunkSize = 100,
}: {
  datasetId: DataStoreName;
  fields: FieldDefinition[];
  title: string;
  onSuccess?: () => void;
  chunkSize?: number;
}) {
  const { loadData } = useLoadData({
    fields,
    datasetId,
    title,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(
    null
  );
  const [importStats, setImportStats] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSelectedFile(file);

    try {
      const validation = await validateCSV(
        file,
        fields.map((f) => f.key)
      );

      if (!validation.isValid) {
        toast.error("CSV validation failed", {
          description: `Missing required columns: ${validation.missingFields.join(", ")}`,
        });
        setSelectedFile(null);
        return;
      }

      const data = await parseCSV(file, fields);

      setParsedData(data);
      setImportStats({
        total: data.length,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
      });

      toast.success("File parsed successfully", {
        description: `Found ${data.length} records ready to import`,
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const processData = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsProcessing(true);
    const total = parsedData.length;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = parsedData.slice(i, i + chunkSize);

      try {
        const importedCount = await ApiService.importRecords(datasetId, chunk);
        succeeded += importedCount;
      } catch (error) {
        console.error(`Error importing chunk ${i / chunkSize + 1}:`, error);
        failed += chunk.length;
        errors.push(
          `Chunk ${i / chunkSize + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      processed += chunk.length;

      setProgress(Math.round((processed / total) * 100));
      setImportStats({
        total,
        processed,
        succeeded,
        failed,
        errors,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    setIsProcessing(false);

    if (succeeded > 0) {
      await loadData();

      toast.success("Import completed", {
        description: `Successfully imported ${succeeded} records${failed > 0 ? `, ${failed} failed` : ""}`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } else if (failed > 0) {
      toast.error("Import failed", {
        description: `All ${failed} records failed to import`,
      });
    }
  };

  const resetImport = () => {
    setParsedData(null);
    setSelectedFile(null);
    setProgress(0);
    setImportStats({
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    });
  };

  const handleClose = () => {
    if (isProcessing) return;

    setIsOpen(false);

    setTimeout(() => {
      resetImport();
    }, 300);
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

  const renderDialogContent = () => (
    <div className="space-y-6 py-4">
      {!parsedData ? (
        <>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            {isUploading ? (
              <p>Parsing file...</p>
            ) : selectedFile ? (
              <p>{selectedFile.name}</p>
            ) : (
              <>
                <p className="font-medium">Click to upload CSV file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or drag and drop
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Ready to import</h3>
              <Badge variant="outline">{importStats.total} records</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 rounded-md bg-muted">
                <p className="text-muted-foreground">Processed</p>
                <p className="font-medium">
                  {importStats.processed} / {importStats.total}
                </p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="text-muted-foreground">Succeeded</p>
                <p className="font-medium text-green-600">
                  {importStats.succeeded}
                </p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="text-muted-foreground">Failed</p>
                <p className="font-medium text-red-600">{importStats.failed}</p>
              </div>
            </div>
            {importStats.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importStats.errors.length === 1 ? (
                    importStats.errors[0]
                  ) : (
                    <details>
                      <summary className="cursor-pointer">
                        {importStats.errors.length} errors occurred
                      </summary>
                      <ul className="mt-2 text-sm list-disc pl-4">
                        {importStats.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {importStats.errors.length > 5 && (
                          <li>...and {importStats.errors.length - 5} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {importStats.processed === importStats.total &&
              importStats.succeeded > 0 && (
                <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully!
                  </AlertDescription>
                </Alert>
              )}
          </div>
        </>
      )}
    </div>
  );

  const renderDialogFooter = () => {
    if (!parsedData) {
      return (
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      );
    }

    if (importStats.processed === importStats.total) {
      return (
        <Button onClick={handleClose} disabled={isProcessing}>
          Close
        </Button>
      );
    }

    return (
      <div className="flex justify-between w-full">
        <Button variant="ghost" onClick={resetImport} disabled={isProcessing}>
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={processData} disabled={isProcessing || !parsedData}>
          {isProcessing ? "Processing..." : "Start Import"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <ReusableCard
        title={`Import ${title} Data`}
        description={
          <span>Import large CSV files with {title.toLowerCase()} data</span>
        }
        content={
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Use this tool to import large CSV files with {title.toLowerCase()}{" "}
              data. The importer can handle thousands of records by processing
              them in batches.
            </p>
            <div className="flex justify-between">
              <Button variant="default" onClick={() => setIsOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Start CSV Import
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>
        }
      />
      <ReusableDialog
        title={`Import ${title} Data`}
        description={`Upload and process your CSV file with ${title.toLowerCase()} records.`}
        open={isOpen}
        onOpenChange={(open) => {
          // Prevent closing when processing
          if (isProcessing && !open) {
            return;
          }
          setIsOpen(open);
        }}
        showTrigger={false}
        customContent={renderDialogContent()}
        customFooter={renderDialogFooter()}
      />
    </>
  );
}

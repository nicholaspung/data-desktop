// src/features/bloodwork/advanced-csv-import.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, Download, Info, AlertTriangle, Check } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { toast } from "sonner";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format, isValid, parse } from "date-fns";
import Papa from "papaparse";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CSVRow {
  blood_marker_name: string;
  date: string;
  value_number?: string;
  value_text?: string;
  notes?: string;
}

interface ValidationResult {
  valid: boolean;
  invalidRows: {
    row: CSVRow;
    rowIndex: number;
    errors: string[];
  }[];
  validRowCount: number;
  dateGroups: {
    date: string;
    formattedDate: Date;
    recordCount: number;
    existingTest: boolean;
  }[];
  hasValidRows: boolean; // New property to check if at least one valid row exists
}

export default function BloodworkCSVImport() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  });
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [skipInvalidRows, setSkipInvalidRows] = useState(true); // New state for skipping invalid rows
  const [activeTab, setActiveTab] = useState("upload");
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);

  // Get blood markers from store for the template
  const bloodMarkers = useStore(
    dataStore,
    (state) => state.blood_markers || []
  );
  const existingTests = useStore(dataStore, (state) => state.bloodwork || []);
  const bloodResults = useStore(
    dataStore,
    (state) => state.blood_results || []
  );

  const generateCSVTemplate = () => {
    // Sort markers alphabetically for the template
    const sortedMarkers = [...bloodMarkers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Create CSV header
    let csv = "blood_marker_name,date,value_number,value_text,notes\n";

    // Add rows for each marker
    sortedMarkers.forEach((marker) => {
      csv += `"${marker.name}",,,,\n`;
    });

    // Create and download the file
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bloodwork_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully!");
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      // Automatically validate the file when selected
      await validateCSV(selectedFile);
    }
  };

  const validateCSV = async (csvFile: File) => {
    try {
      const text = await csvFile.text();

      // Parse CSV
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as CSVRow[];
          setParsedData(data);

          const invalidRows: ValidationResult["invalidRows"] = [];
          const dateGroups: Map<
            string,
            {
              date: string;
              formattedDate: Date;
              recordCount: number;
              existingTest: boolean;
            }
          > = new Map();

          // Validate each row
          data.forEach((row, index) => {
            const errors: string[] = [];

            // Check required fields
            if (!row.blood_marker_name) errors.push("Missing marker name");
            if (!row.date) errors.push("Missing date");
            if (
              (!row.value_text || row.value_text.trim() === "") &&
              (!row.value_number || row.value_number.trim() === "")
            )
              errors.push(
                "Missing value (either value_number or value_text is required)"
              );

            // Validate marker exists
            const markerExists = bloodMarkers.some(
              (m) =>
                m.name.toLowerCase() === row.blood_marker_name?.toLowerCase()
            );
            if (row.blood_marker_name && !markerExists) {
              errors.push(`Marker "${row.blood_marker_name}" does not exist`);
            }

            // Validate date format
            let formattedDate: Date | null = null;
            if (row.date) {
              // Try different date formats
              const dateFormats = [
                "yyyy-MM-dd",
                "MM/dd/yyyy",
                "dd/MM/yyyy",
                "MM-dd-yyyy",
              ];

              for (const format of dateFormats) {
                const parsedDate = parse(row.date, format, new Date());
                if (isValid(parsedDate)) {
                  formattedDate = parsedDate;
                  break;
                }
              }

              if (!formattedDate) {
                errors.push("Invalid date format. Use YYYY-MM-DD");
              } else {
                // Group by date
                const dateKey = format(formattedDate, "yyyy-MM-dd");

                // Check if test exists for this date
                const existingTest = existingTests.some((test) => {
                  const testDate =
                    test.date instanceof Date ? test.date : new Date(test.date);
                  return format(testDate, "yyyy-MM-dd") === dateKey;
                });

                if (dateGroups.has(dateKey)) {
                  dateGroups.get(dateKey)!.recordCount++;
                } else {
                  dateGroups.set(dateKey, {
                    date: dateKey,
                    formattedDate,
                    recordCount: 1,
                    existingTest,
                  });
                }
              }
            }

            // Validate value based on type
            if (row.value_number && row.value_number.trim() !== "") {
              const numValue = parseFloat(row.value_number);
              if (isNaN(numValue)) {
                errors.push("Value is not a valid number");
              }
            }

            // Add to invalid rows if errors exist
            if (errors.length > 0) {
              invalidRows.push({ row, rowIndex: index + 2, errors });
            }
          });

          // Set validation result
          const result = {
            valid: invalidRows.length === 0,
            invalidRows,
            validRowCount: data.length - invalidRows.length,
            dateGroups: Array.from(dateGroups.values()),
            hasValidRows: data.length - invalidRows.length > 0, // Check if we have at least one valid row
          };

          setValidationResult(result);

          // Switch to the validation tab if there are errors
          if (invalidRows.length > 0) {
            setActiveTab("validation");
            if (result.hasValidRows) {
              toast.warning(
                `Found ${invalidRows.length} invalid rows, but ${result.validRowCount} valid rows are ready to import`
              );
            } else {
              toast.error(
                `Found ${invalidRows.length} invalid rows and no valid data to import`
              );
            }
          } else if (data.length === 0) {
            toast.error("The CSV file is empty or has no valid data");
          } else {
            setActiveTab("review");
            toast.success("CSV validation successful!");
          }
        },
        error: (error: any) => {
          console.error("CSV Parse Error:", error);
          toast.error("Error parsing CSV file");
        },
      });
    } catch (error) {
      console.error("File validation error:", error);
      toast.error("Error validating file");
    }
  };

  const processCSV = async () => {
    if (
      !file ||
      !validationResult ||
      (!validationResult.valid && !validationResult.hasValidRows)
    ) {
      toast.error(
        "Please select a valid file with at least one valid row to import"
      );
      return;
    }

    setIsProcessing(true);
    setProgress({
      processed: 0,
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    });

    try {
      // Filter out invalid rows if skip is enabled
      const dataToProcess = skipInvalidRows
        ? parsedData.filter(
            (row, index) =>
              !validationResult.invalidRows.some(
                (invalid) => invalid.rowIndex - 2 === index
              )
          )
        : parsedData;

      // Group records by date
      const recordsByDate: Record<string, CSVRow[]> = {};

      dataToProcess.forEach((row) => {
        if (!row.blood_marker_name || !row.date) {
          return; // Skip rows with missing required data
        }

        // Skip if both value_number and value_text are empty
        if (
          (row.value_number === undefined ||
            row.value_number === null ||
            String(row.value_number).trim() === "") &&
          (row.value_text === undefined ||
            row.value_text === null ||
            row.value_text.trim() === "")
        ) {
          return; // Skip entries with no values
        }

        // Try different date formats
        let validDate: Date | null = null;
        const dateFormats = [
          "yyyy-MM-dd",
          "MM/dd/yyyy",
          "dd/MM/yyyy",
          "MM-dd-yyyy",
        ];

        for (const format of dateFormats) {
          const parsedDate = parse(row.date, format, new Date());
          if (isValid(parsedDate)) {
            validDate = parsedDate;
            break;
          }
        }

        if (!validDate) return; // Skip invalid dates

        const dateKey = format(validDate, "yyyy-MM-dd");
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = [];
        }

        recordsByDate[dateKey].push(row);
      });

      // Process each date group
      const dateKeys = Object.keys(recordsByDate);
      setProgress({ ...progress, total: dateKeys.length });

      for (let i = 0; i < dateKeys.length; i++) {
        const dateKey = dateKeys[i];
        const records = recordsByDate[dateKey];

        // Check if test exists for this date
        let testId = null;
        let createNew = true;

        // Find existing test for this date
        const existingTest = existingTests.find((test) => {
          const testDate =
            test.date instanceof Date ? test.date : new Date(test.date);
          return format(testDate, "yyyy-MM-dd") === dateKey;
        });

        if (existingTest) {
          testId = existingTest.id;
          createNew = false;

          // Skip if we're not overwriting existing tests
          if (!overwriteExisting) {
            setProgress((prev) => ({
              ...prev,
              processed: prev.processed + 1,
              succeeded: prev.succeeded,
              failed: prev.failed + 1,
              errors: [
                ...prev.errors,
                `Skipped ${dateKey} - test already exists`,
              ],
            }));
            continue;
          }
        }

        if (createNew) {
          // Create new test
          try {
            const parsedDate = parse(dateKey, "yyyy-MM-dd", new Date());
            const newTest = await ApiService.addRecord("bloodwork", {
              date: parsedDate,
              fasted: false, // Default value
              lab_name: "",
              notes: `Imported from CSV on ${format(new Date(), "MMM d, yyyy")}`,
            });

            if (newTest) {
              testId = newTest.id;
              addEntry(newTest, "bloodwork");
            }
          } catch (error) {
            console.error(`Error creating test for ${dateKey}:`, error);
            setProgress((prev) => ({
              ...prev,
              errors: [...prev.errors, `Failed to create test for ${dateKey}`],
            }));
            continue; // Skip to next date
          }
        }

        if (!testId) continue;

        // Process records for this date
        let successCount = 0;
        let failCount = 0;

        for (const record of records) {
          try {
            // Find marker ID by name
            const marker = bloodMarkers.find(
              (m) =>
                m.name.toLowerCase() === record.blood_marker_name.toLowerCase()
            );

            if (!marker) {
              failCount++;
              continue;
            }

            // Check if result already exists
            if (!overwriteExisting) {
              const existingResult = bloodResults.some(
                (result) =>
                  result.blood_test_id === testId &&
                  result.blood_marker_id === marker.id
              );

              if (existingResult) {
                failCount++;
                continue;
              }
            }

            // Determine value type (text or number)
            let valueType = "number";
            let valueNumber = 0;
            let valueText = "";

            // Skip if both value_number and value_text are empty
            if (
              (record.value_number === undefined ||
                record.value_number === null ||
                String(record.value_number).trim() === "") &&
              (record.value_text === undefined ||
                record.value_text === null ||
                record.value_text.trim() === "")
            ) {
              // Skip this entry if no values are provided
              failCount++;
              console.warn(
                `Skipping empty value for ${record.blood_marker_name}`
              );
              continue;
            }

            // Handle value based on what fields are present in the CSV
            if (record.value_number && record.value_number.trim() !== "") {
              valueType = "number";
              valueNumber = parseFloat(record.value_number) || 0;
            } else if (record.value_text && record.value_text.trim() !== "") {
              valueType = "text";
              valueText = record.value_text;
            } else {
              // Skip this entry if no values are provided - this is a safeguard
              failCount++;
              continue;
            }

            const resultData = {
              blood_test_id: testId,
              blood_marker_id: marker.id,
              value_number: valueType === "number" ? valueNumber : 0,
              value_text: valueType === "text" ? valueText : "",
              notes: record.notes || "",
            };

            // Add blood result
            const response = await ApiService.addRecord(
              "blood_results",
              resultData
            );
            if (response) {
              addEntry(response, "blood_results");
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            console.error(
              `Error adding result for ${record.blood_marker_name}:`,
              error
            );
            failCount++;
          }
        }

        // Update progress
        setProgress((prev) => ({
          ...prev,
          processed: i + 1,
          succeeded: prev.succeeded + successCount,
          failed: prev.failed + failCount,
        }));
        toast.success(
          `Imported ${successCount} blood results across ${dateKeys.length} dates`
        );
      }

      setOpen(false);
    } catch (error) {
      console.error("CSV import error:", error);
      toast.error("Error importing CSV data");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setValidationResult(null);
    setParsedData([]);
    setActiveTab("upload");
    setProgress({
      processed: 0,
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    });
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          resetImport();
          setOpen(true);
        }}
      >
        <FileUp className="h-4 w-4" />
        Import CSV
      </Button>

      <ReusableDialog
        title="Import Bloodwork CSV"
        description="Upload a CSV file with bloodwork data. Download the template for the correct format."
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            resetImport();
          }
          setOpen(newOpen);
        }}
        showTrigger={false}
        confirmText={activeTab === "review" ? "Import Data" : "Continue"}
        onConfirm={
          activeTab === "review" ? processCSV : () => setActiveTab("review")
        }
        disableDefaultConfirm={activeTab !== "review"}
        loading={isProcessing}
        confirmIcon={
          activeTab === "review" ? (
            <FileUp className="h-4 w-4 mr-2" />
          ) : undefined
        }
        footerActionDisabled={
          (activeTab === "upload" && !file) ||
          (activeTab === "validation" &&
            (!validationResult ||
              (!validationResult.valid && !validationResult.hasValidRows))) ||
          isProcessing
        }
        contentClassName="max-h-[95vh] overflow-hidden max-w-[800px]"
        customContent={
          <div className="py-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="validation" disabled={!file}>
                  Validation
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  disabled={
                    !validationResult ||
                    (!validationResult.valid && !validationResult.hasValidRows)
                  }
                >
                  Review
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(60vh-100px)] px-4 mt-4">
                <TabsContent value="upload" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>CSV Format</AlertTitle>
                    <AlertDescription>
                      Your CSV must have columns for blood_marker_name, date,
                      and either value_number or value_text (at least one is
                      required). Optionally include notes column.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={generateCSVTemplate}
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>

                    <p className="text-sm text-muted-foreground">
                      {bloodMarkers.length === 0
                        ? "No markers found. Please add markers first."
                        : `Template contains ${bloodMarkers.length} markers`}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="csvFile" className="text-sm font-medium">
                      Select CSV File
                    </label>
                    <input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </div>

                  {file && (
                    <div className="text-sm text-muted-foreground">
                      File selected: {file.name} (
                      {(file.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="validation" className="space-y-4">
                  {validationResult && (
                    <>
                      <div className="flex items-center gap-2">
                        {validationResult.valid ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : validationResult.hasValidRows ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}

                        <h3 className="text-lg font-semibold">
                          {validationResult.valid
                            ? "Validation Successful"
                            : validationResult.hasValidRows
                              ? "Some Issues Found"
                              : "No Valid Rows Found"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-3">
                          <p className="text-sm font-medium mb-1">Valid Rows</p>
                          <p className="text-2xl font-bold">
                            {validationResult.validRowCount}
                          </p>
                        </div>

                        <div className="border rounded-md p-3">
                          <p className="text-sm font-medium mb-1">
                            Invalid Rows
                          </p>
                          <p className="text-2xl font-bold">
                            {validationResult.invalidRows.length}
                          </p>
                        </div>
                      </div>

                      {validationResult.invalidRows.length > 0 && (
                        <div className="border rounded-md">
                          <div className="bg-muted p-2 font-medium">
                            Invalid Rows
                          </div>
                          <ScrollArea className="h-48">
                            <div className="p-2 space-y-2">
                              {validationResult.invalidRows.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="border-b pb-2 last:border-0"
                                  >
                                    <div className="flex justify-between">
                                      <p className="text-sm font-medium">
                                        Row {item.rowIndex}
                                      </p>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {item.errors.length}{" "}
                                        {item.errors.length === 1
                                          ? "error"
                                          : "errors"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {`Marker: ${item.row.blood_marker_name || "missing"}, `}
                                      {`Date: ${item.row.date || "missing"}, `}
                                      {`Value Number: ${item.row.value_number || "missing"}, `}
                                      {`Value Text: ${item.row.value_text || "missing"}`}
                                    </p>
                                    <ul className="text-xs text-red-500 mt-1">
                                      {item.errors.map((error, i) => (
                                        <li key={i}>• {error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {!validationResult.valid && (
                        <>
                          {validationResult.hasValidRows ? (
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id="skipInvalidRows"
                                checked={skipInvalidRows}
                                onCheckedChange={(checked) =>
                                  setSkipInvalidRows(checked === true)
                                }
                              />
                              <Label
                                htmlFor="skipInvalidRows"
                                className="text-sm"
                              >
                                Skip invalid rows during import
                              </Label>
                            </div>
                          ) : (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Cannot Proceed</AlertTitle>
                              <AlertDescription>
                                No valid rows found. Please fix the validation
                                errors before proceeding. You can go back to the
                                upload tab and select a corrected file.
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="review" className="space-y-4">
                  {validationResult && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <h3 className="text-lg font-semibold">
                          Ready to Import
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-3">
                          <p className="text-sm font-medium mb-1">Total Rows</p>
                          <p className="text-2xl font-bold">
                            {validationResult.validRowCount}
                          </p>
                        </div>

                        <div className="border rounded-md p-3">
                          <p className="text-sm font-medium mb-1">
                            Date Groups
                          </p>
                          <p className="text-2xl font-bold">
                            {validationResult.dateGroups.length}
                          </p>
                        </div>
                      </div>

                      {validationResult.invalidRows.length > 0 &&
                        skipInvalidRows && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Skipping Invalid Rows</AlertTitle>
                            <AlertDescription>
                              {validationResult.invalidRows.length} invalid
                              row(s) will be skipped during import.
                            </AlertDescription>
                          </Alert>
                        )}

                      <div className="border rounded-md">
                        <div className="bg-muted p-2 font-medium">
                          Dates Summary
                        </div>
                        <ScrollArea className="h-48">
                          <div className="p-2 space-y-2">
                            {validationResult.dateGroups.map((group, index) => (
                              <div
                                key={index}
                                className="border-b pb-2 last:border-0"
                              >
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium">
                                    {format(
                                      group.formattedDate,
                                      "MMMM d, yyyy"
                                    )}
                                  </p>
                                  <Badge
                                    variant={
                                      group.existingTest
                                        ? "outline"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {group.existingTest
                                      ? "Existing Test"
                                      : "New Test"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {group.recordCount}{" "}
                                  {group.recordCount === 1
                                    ? "marker result"
                                    : "marker results"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="overwriteExisting"
                          checked={overwriteExisting}
                          onCheckedChange={(checked) =>
                            setOverwriteExisting(checked === true)
                          }
                        />
                        <Label htmlFor="overwriteExisting" className="text-sm">
                          Overwrite existing results for the same markers and
                          dates
                        </Label>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Import Information</AlertTitle>
                        <AlertDescription>
                          {validationResult.dateGroups.some(
                            (g) => g.existingTest
                          ) ? (
                            <>
                              {overwriteExisting
                                ? "Existing test data may be overwritten based on your selection."
                                : "Existing test dates will be preserved and only new marker results will be added."}
                            </>
                          ) : (
                            "All dates in this import will create new test records."
                          )}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress
                        value={(progress.processed / progress.total) * 100}
                      />
                      <p className="text-sm text-muted-foreground">
                        Processing {progress.processed} of {progress.total}{" "}
                        dates...
                      </p>
                      {progress.errors.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc pl-4">
                            {progress.errors.slice(0, 3).map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                            {progress.errors.length > 3 && (
                              <li>...and {progress.errors.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        }
      />
    </>
  );
}

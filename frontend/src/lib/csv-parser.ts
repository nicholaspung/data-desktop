// src/lib/csv-parser.ts
import { FieldDefinition } from "@/types/types";
import Papa from "papaparse";
import { ApiService } from "@/services/api";

/**
 * Parses a CSV file and returns the processed data
 */
export async function parseCSV(
  file: File,
  fieldDefinitions: FieldDefinition[]
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    // Set up field definitions lookup for quick access
    const fieldMap = new Map<string, FieldDefinition>();
    fieldDefinitions.forEach((field) => {
      fieldMap.set(field.key, field);
    });

    // Create a lookup for relation fields
    const relationFields = fieldDefinitions.filter(
      (field) => field.isRelation && field.relatedDataset
    );

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => {
        // Standardize headers by trimming whitespace and lowercasing
        return header.trim().toLowerCase();
      },
      complete: async (results) => {
        if (results.errors && results.errors.length > 0) {
          // Log parsing errors
          console.error("CSV parsing errors:", results.errors);

          // If the errors are critical, reject
          const hasCriticalError = results.errors.some(
            (e) =>
              e.message &&
              (e.message.includes("fatal") ||
                e.message.toLowerCase().includes("error") ||
                e.message.toLowerCase().includes("unclosed"))
          );

          if (hasCriticalError) {
            reject(
              new Error(
                "Critical error parsing CSV: " + results.errors[0].message
              )
            );
            return;
          }
        }

        // Check if we have any data
        if (!results.data || results.data.length === 0) {
          reject(new Error("No data found in CSV file"));
          return;
        }

        try {
          // Load relation data for all relation fields at once
          const relationData = await loadRelationData(relationFields);

          // Process the data according to field definitions
          const processedData = (results.data as Record<string, any>[]).map(
            (row: Record<string, any>, index: number) => {
              // Generate a new record with ID
              const processedRow: Record<string, any> = {
                id: crypto.randomUUID(),
              };

              // Process each field based on its type
              fieldDefinitions.forEach((field) => {
                try {
                  // Get value from standardized header, handling potential capitalization differences
                  let value =
                    row[field.key] ??
                    row[field.key.toLowerCase()] ??
                    row[field.key.toUpperCase()];

                  // Basic null/undefined check
                  if (value === undefined || value === null) {
                    // For numeric fields, default to 0, for boolean false, for dates now, for text empty string
                    switch (field.type) {
                      case "number":
                      case "percentage":
                        processedRow[field.key] = 0;
                        break;
                      case "boolean":
                        processedRow[field.key] = false;
                        break;
                      case "date":
                        processedRow[field.key] = new Date();
                        break;
                      case "text":
                      default:
                        processedRow[field.key] = "";
                        break;
                    }
                    return; // Skip further processing for this field
                  }

                  // Handle relation fields
                  if (field.isRelation && field.relatedDataset) {
                    // If the value is already a valid ID, keep it
                    const relationInfo = relationData[field.key];
                    if (relationInfo && relationInfo.idSet.has(value)) {
                      processedRow[field.key] = value;
                      return;
                    }

                    // Try to match the display value to an ID
                    if (relationInfo && typeof value === "string") {
                      const normalizedValue = value.toLowerCase().trim();
                      const matchedId =
                        relationInfo.displayToIdMap.get(normalizedValue);

                      if (matchedId) {
                        processedRow[field.key] = matchedId;
                        return;
                      }

                      // If no exact match found, try partial matching
                      for (const [
                        displayValue,
                        id,
                      ] of relationInfo.displayToIdMap.entries()) {
                        if (
                          displayValue.includes(normalizedValue) ||
                          normalizedValue.includes(displayValue)
                        ) {
                          processedRow[field.key] = id;
                          console.log(
                            `Found partial match for "${value}" with "${displayValue}"`
                          );
                          return;
                        }
                      }

                      // No match found, keep as is (will be validated later)
                      processedRow[field.key] = value;
                      console.warn(
                        `No relation match found for ${field.key}: "${value}"`
                      );
                    } else {
                      // Keep the value as is
                      processedRow[field.key] = value;
                    }
                    return;
                  }

                  // Apply type conversions for non-relation fields
                  switch (field.type) {
                    case "date":
                      if (value && !(value instanceof Date)) {
                        // Try to parse various date formats
                        let parsedDate: Date | null = null;

                        // If it's a string, try to parse it
                        if (typeof value === "string") {
                          // Try direct Date parsing
                          parsedDate = new Date(value);

                          // Check if valid
                          if (isNaN(parsedDate.getTime())) {
                            // Try different date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
                            const formats = [
                              /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
                              /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
                              /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY or MM-DD-YYYY
                            ];

                            for (const format of formats) {
                              const match = value.match(format);
                              if (match) {
                                // Try to create a date object based on the format
                                const dateObj = new Date(value);
                                if (!isNaN(dateObj.getTime())) {
                                  parsedDate = dateObj;
                                  break;
                                }
                              }
                            }
                          }
                        } else if (typeof value === "number") {
                          // Might be a timestamp or Excel serial date
                          parsedDate = new Date(value);
                        }

                        // If we still couldn't parse it, use today
                        if (!parsedDate || isNaN(parsedDate.getTime())) {
                          parsedDate = new Date();
                          console.warn(
                            `Row ${index + 1}: Invalid date "${value}" for field "${field.key}", using current date instead.`
                          );
                        }

                        processedRow[field.key] = parsedDate;
                      } else {
                        processedRow[field.key] = value;
                      }
                      break;

                    case "boolean":
                      // Handle various boolean representations
                      if (typeof value === "string") {
                        value = value.toLowerCase().trim();
                        processedRow[field.key] =
                          value === "true" ||
                          value === "yes" ||
                          value === "1" ||
                          value === "y" ||
                          value === "t";
                      } else if (typeof value === "number") {
                        processedRow[field.key] = value !== 0;
                      } else {
                        processedRow[field.key] = Boolean(value);
                      }
                      break;

                    case "number":
                    case "percentage":
                      // Ensure numeric values
                      if (typeof value === "string") {
                        // Remove any % signs, commas, and other non-numeric characters
                        value = value.replace(/[%,$]/g, "").trim();

                        // Try to parse as float
                        const parsed = parseFloat(value);

                        if (isNaN(parsed)) {
                          console.warn(
                            `Row ${index + 1}: Invalid number "${value}" for field "${field.key}", using 0 instead.`
                          );
                          processedRow[field.key] = 0;
                        } else {
                          processedRow[field.key] = parsed;
                        }
                      } else if (typeof value === "boolean") {
                        processedRow[field.key] = value ? 1 : 0;
                      } else if (typeof value !== "number") {
                        console.warn(
                          `Row ${index + 1}: Invalid type for field "${field.key}", using 0 instead.`
                        );
                        processedRow[field.key] = 0;
                      } else {
                        processedRow[field.key] = value;
                      }

                      // For percentage type, ensure it's between 0-100
                      if (
                        field.type === "percentage" &&
                        typeof processedRow[field.key] === "number"
                      ) {
                        if (processedRow[field.key] < 0) {
                          processedRow[field.key] = 0;
                        } else if (processedRow[field.key] > 100) {
                          // If it's greatly above 100, it might be a fraction (e.g. 0.325 instead of 32.5%)
                          if (
                            processedRow[field.key] > 1 &&
                            processedRow[field.key] <= 1
                          ) {
                            processedRow[field.key] *= 100;
                          } else {
                            processedRow[field.key] = 100;
                          }
                        }
                      }
                      break;

                    case "text":
                      // Ensure text values are strings
                      if (typeof value !== "string") {
                        processedRow[field.key] = String(value);
                      } else {
                        processedRow[field.key] = value;
                      }
                      break;

                    default:
                      processedRow[field.key] = value;
                  }
                } catch (error) {
                  console.error(
                    `Error processing field "${field.key}" in row ${index + 1}:`,
                    error
                  );
                  // Provide a safe default based on field type
                  switch (field.type) {
                    case "number":
                    case "percentage":
                      processedRow[field.key] = 0;
                      break;
                    case "boolean":
                      processedRow[field.key] = false;
                      break;
                    case "date":
                      processedRow[field.key] = new Date();
                      break;
                    case "text":
                    default:
                      processedRow[field.key] = "";
                      break;
                  }
                }
              });

              return processedRow;
            }
          );

          resolve(processedData);
        } catch (error) {
          console.error("Error processing CSV data:", error);
          reject(error);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        reject(error);
      },
    });
  });
}

/**
 * Load relation data for all relation fields at once
 * @param relationFields List of relation fields to load data for
 * @returns Mapping of field keys to relation data
 */
async function loadRelationData(relationFields: FieldDefinition[]): Promise<
  Record<
    string,
    {
      idSet: Set<string>;
      displayToIdMap: Map<string, string>;
    }
  >
> {
  const result: Record<
    string,
    {
      idSet: Set<string>;
      displayToIdMap: Map<string, string>;
    }
  > = {};

  // Process each relation field
  for (const field of relationFields) {
    if (!field.relatedDataset || !field.key) continue;

    try {
      // Get the related records
      const records = await ApiService.getRecords(field.relatedDataset);

      // Store all IDs for quick validation
      const idSet = new Set<string>();

      // Map display values to IDs
      const displayToIdMap = new Map<string, string>();

      // Process each record
      records.forEach((record: any) => {
        const id = record.id;
        idSet.add(id);

        // Determine the display value based on the dataset
        // Bloodwork - date-based format
        if (field.relatedDataset === "bloodwork" && record.date) {
          const date = new Date(record.date);
          const dateStr = date.toLocaleDateString();

          // Add all variants of the display value
          displayToIdMap.set(dateStr.toLowerCase(), id);

          if (record.lab_name) {
            const labName = record.lab_name.toLowerCase();
            const combined = `${dateStr} - ${record.lab_name}`.toLowerCase();

            displayToIdMap.set(labName, id);
            displayToIdMap.set(combined, id);
          }

          // Add date in ISO format
          displayToIdMap.set(
            date.toISOString().split("T")[0].toLowerCase(),
            id
          );
        }
        // Blood markers - name + unit format
        else if (field.relatedDataset === "blood_markers") {
          if (record.name) {
            displayToIdMap.set(record.name.toLowerCase(), id);

            if (record.unit) {
              const combined = `${record.name} (${record.unit})`.toLowerCase();
              displayToIdMap.set(combined, id);
              displayToIdMap.set(record.unit.toLowerCase(), id);
            }
          }
        }
        // Generic handling for other datasets
        else {
          // Use display fields if specified
          if (field.displayField && record[field.displayField]) {
            const displayValue = record[field.displayField].toLowerCase();
            displayToIdMap.set(displayValue, id);

            if (
              field.secondaryDisplayField &&
              record[field.secondaryDisplayField]
            ) {
              const secondaryValue =
                record[field.secondaryDisplayField].toLowerCase();
              const combined = `${displayValue} - ${secondaryValue}`;

              displayToIdMap.set(secondaryValue, id);
              displayToIdMap.set(combined, id);
            }
          }

          // Add common fields that might be used for display
          ["name", "title", "label", "displayName"].forEach((key) => {
            if (record[key]) {
              displayToIdMap.set(record[key].toLowerCase(), id);
            }
          });
        }
      });

      // Store the relation data
      result[field.key] = {
        idSet,
        displayToIdMap,
      };
    } catch (error) {
      console.error(
        `Error loading relation data for ${field.relatedDataset}:`,
        error
      );
      result[field.key] = {
        idSet: new Set(),
        displayToIdMap: new Map(),
      };
    }
  }

  return result;
}

/**
 * Validates a CSV file against expected field definitions
 */
export async function validateCSV(
  file: File,
  expectedFields: string[]
): Promise<{ isValid: boolean; missingFields: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 5, // Check a few rows to make sure
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Standardize headers by trimming whitespace and lowercasing
        return header.trim().toLowerCase();
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          // Check for critical errors
          const hasCriticalError = results.errors.some(
            (e) =>
              e.message &&
              (e.message.includes("fatal") ||
                e.message.toLowerCase().includes("error") ||
                e.message.toLowerCase().includes("unclosed"))
          );

          if (hasCriticalError) {
            reject(
              new Error(
                "Critical error validating CSV: " + results.errors[0].message
              )
            );
            return;
          }
        }

        const headers = results.meta.fields || [];

        const normalizedHeaders = headers.map((h) => h.toLowerCase());

        // Check which expected fields are missing
        const missingFields = expectedFields.filter(
          (field) => !normalizedHeaders.includes(field.toLowerCase())
        );

        resolve({
          isValid: missingFields.length === 0,
          missingFields,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Creates a sample CSV template for downloading
 */
export function createCSVTemplate(fields: FieldDefinition[]): string {
  // Extract headers from field definitions
  const headers = fields.map((field) => field.key);

  // Create a row with example data based on field types
  const exampleRow: Record<string, any> = {};
  const headerDesc: Record<string, string> = {};

  fields.forEach((field) => {
    // Add helpful header descriptions for all fields
    headerDesc[field.key] =
      field.displayName + (field.description ? ` - ${field.description}` : "");

    // Add example values based on field type
    if (field.isRelation && field.relatedDataset) {
      // For relation fields, provide descriptive guidance
      let example = "";

      if (field.relatedDataset === "bloodwork") {
        example = "MM/DD/YYYY - Lab Name";
      } else if (field.relatedDataset === "blood_markers") {
        example = "Marker Name";
      } else if (field.displayField) {
        example = `Enter ${field.displayName} name`;
      } else {
        example = "Enter name or ID";
      }

      exampleRow[field.key] = example;
      headerDesc[field.key] += " (Enter name, the system will match to ID)";
    } else {
      switch (field.type) {
        case "date":
          exampleRow[field.key] = new Date().toLocaleDateString();
          break;
        case "boolean":
          exampleRow[field.key] = "Yes";
          headerDesc[field.key] += " (Yes/No, True/False, or 1/0)";
          break;
        case "number":
          exampleRow[field.key] = "0";
          if (field.unit) headerDesc[field.key] += ` (${field.unit})`;
          break;
        case "percentage":
          exampleRow[field.key] = "0";
          headerDesc[field.key] += " (%)";
          break;
        case "text":
          exampleRow[field.key] = "";
          break;
      }
    }
  });

  // Create a second row with field descriptions
  const descriptionRow: Record<string, string> = {};
  headers.forEach((header) => {
    descriptionRow[header] = headerDesc[header] || "";
  });

  // Generate CSV with headers, description row, and example row
  const csvContent = Papa.unparse({
    fields: headers,
    data: [descriptionRow, exampleRow],
  });

  return csvContent;
}

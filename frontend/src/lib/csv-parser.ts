// src/lib/csv-parser.ts
import { FieldDefinition } from "@/types";
import Papa from "papaparse";

/**
 * Parses a CSV file and returns the processed data
 */
export async function parseCSV(
  file: File,
  fieldDefinitions: FieldDefinition[]
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        // Process the data according to field definitions
        const processedData = (results.data as Record<string, any>[]).map(
          (row: Record<string, any>) => {
            const processedRow: Record<string, any> = {
              id: crypto.randomUUID(),
            };

            fieldDefinitions.forEach((field) => {
              let value = row[field.key];

              // Apply type conversions
              switch (field.type) {
                case "date":
                  if (value && !(value instanceof Date)) {
                    processedRow[field.key] = new Date(value);
                  } else {
                    processedRow[field.key] = value;
                  }
                  break;

                case "boolean":
                  // Handle various boolean representations
                  if (typeof value === "string") {
                    value = value.toLowerCase();
                    processedRow[field.key] =
                      value === "true" ||
                      value === "yes" ||
                      value === "1" ||
                      value === "y";
                  } else {
                    processedRow[field.key] = Boolean(value);
                  }
                  break;

                case "number":
                case "percentage":
                  // Ensure numeric values
                  if (typeof value === "string") {
                    // Remove any % signs and convert to number
                    value = value.replace("%", "");
                    processedRow[field.key] = parseFloat(value);
                  } else {
                    processedRow[field.key] = value;
                  }
                  break;

                case "text":
                default:
                  processedRow[field.key] = value;
              }
            });

            return processedRow;
          }
        );

        resolve(processedData);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
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
      preview: 1, // Only need to check headers
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missingFields = expectedFields.filter(
          (field) => !headers.includes(field)
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
  const headers = fields.map((field) => field.key);
  return Papa.unparse([headers]);
}

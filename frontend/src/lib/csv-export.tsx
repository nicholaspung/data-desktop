// src/lib/csv-export.ts
import Papa from "papaparse";
import { FieldDefinition } from "@/types";

/**
 * Converts data to CSV format and triggers a download
 * @param data The data to export
 * @param fields Field definitions for column formatting
 * @param filename The name of the downloaded file
 */
export function exportToCSV(
  data: Record<string, any>[],
  fields: FieldDefinition[],
  filename: string = "export.csv"
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // Create a map for field type lookup
    const fieldTypeMap = new Map<string, string>();
    fields.forEach((field) => {
      fieldTypeMap.set(field.key, field.type);
    });

    // Process the data to ensure dates are formatted correctly and other special handling
    const processedData = data.map((row) => {
      const processedRow: Record<string, any> = {};

      // Process each field based on its type
      Object.keys(row).forEach((key) => {
        // Skip metadata fields like id, createdAt, etc. unless they're explicitly in the fields list
        if (
          !fieldTypeMap.has(key) &&
          ["id", "createdAt", "lastModified", "datasetId"].includes(key)
        ) {
          return;
        }

        const value = row[key];
        const fieldType = fieldTypeMap.get(key);

        // Handle different field types
        if (fieldType === "date" && value) {
          // Format date as YYYY-MM-DD for best compatibility
          const date = value instanceof Date ? value : new Date(value);
          if (!isNaN(date.getTime())) {
            processedRow[key] = date.toISOString().split("T")[0];
          } else {
            processedRow[key] = "";
          }
        } else if (fieldType === "boolean") {
          // Output booleans as Yes/No for better readability
          processedRow[key] = value ? "Yes" : "No";
        } else if (
          fieldType === "percentage" &&
          typeof value === "number" &&
          value < 1
        ) {
          // Handle percentages stored as decimals
          processedRow[key] = (value * 100).toFixed(2);
        } else {
          processedRow[key] = value;
        }
      });

      return processedRow;
    });

    // Generate the CSV content
    const csv = Papa.unparse(processedData, {
      header: true,
      newline: "\r\n", // Standard line ending for best compatibility
    });

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Set up the download
    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data to CSV:", error);
  }
}

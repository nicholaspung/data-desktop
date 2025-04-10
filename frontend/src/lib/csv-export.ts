// src/lib/csv-export.ts
import Papa from "papaparse";
import { FieldDefinition } from "@/types/types";

/**
 * Converts data to CSV format and triggers a download
 * @param data The data to export
 * @param fields Field definitions for column formatting
 * @param filename The name of the downloaded file
 * @param visibleColumns Optional array of column keys to include in the export
 */
export function exportToCSV(
  data: Record<string, any>[],
  fields: FieldDefinition[],
  filename: string = "export.csv",
  visibleColumns?: string[]
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // Create a map for field type lookup and to identify relation fields
    const fieldMap = new Map<string, FieldDefinition>();
    fields.forEach((field) => {
      fieldMap.set(field.key, field);
    });

    // If visibleColumns is provided, filter the fields to only include those columns
    const columnsToExport = visibleColumns
      ? fields.filter((field) => visibleColumns.includes(field.key))
      : fields;

    // Process the data to ensure dates are formatted correctly and relations are resolved
    const processedData = data.map((row) => {
      const processedRow: Record<string, any> = {};

      // Process only fields that should be exported
      columnsToExport.forEach((field) => {
        const key = field.key;
        const value = row[key];

        // Handle relation fields
        if (field.isRelation) {
          // For relation fields, try to use the related data if available
          const relatedDataKey = `${key}_data`;
          const relatedData = row[relatedDataKey];

          if (relatedData) {
            // Use the display field from the relation field definition if provided
            if (field.displayField && relatedData[field.displayField]) {
              // Include secondary display field if available
              if (
                field.secondaryDisplayField &&
                relatedData[field.secondaryDisplayField]
              ) {
                processedRow[key] =
                  `${relatedData[field.displayField]} (${relatedData[field.secondaryDisplayField]})`;
              } else {
                processedRow[key] = relatedData[field.displayField];
              }
            } else {
              // Smart fallback strategy for display value
              processedRow[key] =
                relatedData.name ||
                relatedData.title ||
                relatedData.displayName ||
                relatedData.label ||
                // Date-based fallback for records with dates
                (relatedData.date
                  ? new Date(relatedData.date).toLocaleDateString()
                  : `ID: ${value}`);
            }
          } else {
            // If related data is not available, use the ID with a prefix
            processedRow[key] = value ? `ID: ${value}` : "";
          }
        }
        // Handle different field types
        else if (field.type === "date" && value) {
          // Format date as YYYY-MM-DD for best compatibility
          const date = value instanceof Date ? value : new Date(value);
          if (!isNaN(date.getTime())) {
            processedRow[key] = date.toISOString().split("T")[0];
          } else {
            processedRow[key] = "";
          }
        } else if (field.type === "boolean") {
          // Output booleans as Yes/No for better readability
          processedRow[key] = value ? "Yes" : "No";
        } else if (
          field.type === "percentage" &&
          typeof value === "number" &&
          value < 1
        ) {
          // Handle percentages stored as decimals
          processedRow[key] = (value * 100).toFixed(2);
        } else {
          processedRow[key] =
            value !== undefined && value !== null ? value : "";
        }
      });

      return processedRow;
    });

    // Generate column headers from the fields to ensure correct order
    const headers = columnsToExport.map((field) => {
      // Use display name instead of key for better readability
      return {
        id: field.key,
        title: field.displayName || field.key,
      };
    });

    // Configure Papa Parse unparse options with custom headers
    const papaConfig = {
      header: true,
      columns: headers.map((h) => h.id),
      newline: "\r\n", // Standard line ending for best compatibility
    };

    // Generate the CSV content with custom headers
    const csv = Papa.unparse(processedData, papaConfig);

    // Replace header row with display names
    const headerRow = headers.map((h) => `"${h.title}"`).join(",");
    const rows = csv.split("\r\n");
    rows[0] = headerRow;
    const finalCsv = rows.join("\r\n");

    // Create a blob and download link
    const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
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

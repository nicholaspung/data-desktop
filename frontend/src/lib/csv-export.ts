import Papa from "papaparse";
import { FieldDefinition } from "@/types/types";

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
    const fieldMap = new Map<string, FieldDefinition>();
    fields.forEach((field) => {
      fieldMap.set(field.key, field);
    });

    const columnsToExport = visibleColumns
      ? fields.filter((field) => visibleColumns.includes(field.key))
      : fields;

    const processedData = data.map((row) => {
      const processedRow: Record<string, any> = {};

      columnsToExport.forEach((field) => {
        const key = field.key;
        const value = row[key];

        if (field.type === "image") {
          processedRow[key] = value ? "[Image]" : "";
        } else if (field.isRelation) {
          const relatedDataKey = `${key}_data`;
          const relatedData = row[relatedDataKey];

          if (relatedData) {
            if (field.displayField && relatedData[field.displayField]) {
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
              processedRow[key] =
                relatedData.name ||
                relatedData.title ||
                relatedData.displayName ||
                relatedData.label ||
                (relatedData.date
                  ? new Date(relatedData.date).toLocaleDateString()
                  : `ID: ${value}`);
            }
          } else {
            processedRow[key] = value ? `ID: ${value}` : "";
          }
        } else if (field.type === "date" && value) {
          const date = value instanceof Date ? value : new Date(value);
          if (!isNaN(date.getTime())) {
            processedRow[key] = date.toISOString().split("T")[0];
          } else {
            processedRow[key] = "";
          }
        } else if (field.type === "boolean") {
          processedRow[key] = value ? "Yes" : "No";
        } else if (
          field.type === "percentage" &&
          typeof value === "number" &&
          value < 1
        ) {
          processedRow[key] = (value * 100).toFixed(2);
        } else if (field.type === "markdown") {
          processedRow[key] = value ? value.replace(/[#*_`[\]()]/g, "") : "";
        } else {
          processedRow[key] =
            value !== undefined && value !== null ? value : "";
        }
      });

      return processedRow;
    });

    const headers = columnsToExport.map((field) => {
      return {
        id: field.key,
        title: field.displayName || field.key,
      };
    });

    const papaConfig = {
      header: true,
      columns: headers.map((h) => h.id),
      newline: "\r\n",
    };

    const csv = Papa.unparse(processedData, papaConfig);

    const headerRow = headers.map((h) => `"${h.title}"`).join(",");
    const rows = csv.split("\r\n");
    rows[0] = headerRow;
    const finalCsv = rows.join("\r\n");

    const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data to CSV:", error);
  }
}

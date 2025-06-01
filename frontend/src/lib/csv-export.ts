import Papa from "papaparse";
import JSZip from "jszip";
import { FieldDefinition } from "@/types/types";
import { ApiService } from "@/services/api";

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

        if (field.type === "file") {
          processedRow[key] = value ? "[Image]" : "";
        } else if (field.type === "file-multiple") {
          if (value && Array.isArray(value)) {
            processedRow[key] =
              value.length > 0 ? `[${value.length} files]` : "";
          } else {
            processedRow[key] = value ? "[Multiple files]" : "";
          }
        } else if (field.isRelation) {
          const relatedDataKey = `${key}_data`;
          const relatedData = row[relatedDataKey] as
            | Record<string, unknown>
            | undefined;

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
                (relatedData.name as string) ||
                (relatedData.title as string) ||
                (relatedData.displayName as string) ||
                (relatedData.label as string) ||
                (relatedData.date
                  ? new Date(
                      relatedData.date as string | number | Date
                    ).toLocaleDateString()
                  : `ID: ${value}`);
            }
          } else {
            processedRow[key] = value ? `ID: ${value}` : "";
          }
        } else if (field.type === "date" && value) {
          const date =
            value instanceof Date
              ? value
              : new Date(value as string | number | Date);
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
          processedRow[key] =
            value && typeof value === "string"
              ? value.replace(/[#*_`[\]()]/g, "")
              : "";
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

export async function exportToZipWithFiles(
  data: Record<string, unknown>[],
  fields: FieldDefinition[],
  filename: string = "export",
  visibleColumns?: string[]
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    const zip = new JSZip();

    const fieldMap = new Map<string, FieldDefinition>();
    fields.forEach((field) => {
      fieldMap.set(field.key, field);
    });

    const columnsToExport = visibleColumns
      ? fields.filter((field) => visibleColumns.includes(field.key))
      : fields;

    const fileDownloadMap = new Map<string, string>();
    const processedData = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const processedRow: Record<string, unknown> = {};

      for (const field of columnsToExport) {
        const key = field.key;
        const value = row[key];

        if (field.type === "file" || field.type === "file-multiple") {
          if (value) {
            if (field.type === "file-multiple") {
              const fileObjects = Array.isArray(value) ? value : [value];
              const localPaths: string[] = [];

              for (
                let fileIndex = 0;
                fileIndex < fileObjects.length;
                fileIndex++
              ) {
                const fileObj = fileObjects[fileIndex];
                let fileUrl = "";
                let fileName = "";

                if (typeof fileObj === "string") {
                  fileUrl = fileObj;
                  fileName = `file${fileIndex + 1}`;
                } else if (fileObj && typeof fileObj === "object") {
                  fileUrl =
                    (fileObj as any).src ||
                    (fileObj as any).url ||
                    (fileObj as any).path ||
                    "";
                  fileName = (fileObj as any).name || `file${fileIndex + 1}`;
                }

                if (fileUrl) {
                  const fileExtension =
                    getFileExtension(fileName) || getFileExtension(fileUrl);
                  const localPath = `files/${key}_row${rowIndex + 1}_${fileName}${fileExtension}`;
                  localPaths.push(localPath);

                  if (!fileDownloadMap.has(fileUrl)) {
                    fileDownloadMap.set(fileUrl, localPath);
                  }
                }
              }
              processedRow[key] =
                localPaths.length > 0 ? localPaths.join(";") : "";
            } else {
              let fileUrl = "";
              let fileName = "";

              if (typeof value === "string") {
                fileUrl = value;
                fileName = "file";
              } else if (value && typeof value === "object") {
                fileUrl =
                  (value as any).src ||
                  (value as any).url ||
                  (value as any).path ||
                  "";
                fileName = (value as any).name || "file";
              }

              if (fileUrl) {
                const fileExtension =
                  getFileExtension(fileName) || getFileExtension(fileUrl);
                const localPath = `files/${key}_row${rowIndex + 1}_${fileName}${fileExtension}`;
                processedRow[key] = localPath;

                if (!fileDownloadMap.has(fileUrl)) {
                  fileDownloadMap.set(fileUrl, localPath);
                }
              } else {
                processedRow[key] = "";
              }
            }
          } else {
            processedRow[key] = "";
          }
        } else if (field.isRelation) {
          const relatedDataKey = `${key}_data`;
          const relatedData = row[relatedDataKey] as
            | Record<string, unknown>
            | undefined;

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
                (relatedData.name as string) ||
                (relatedData.title as string) ||
                (relatedData.displayName as string) ||
                (relatedData.label as string) ||
                (relatedData.date
                  ? new Date(
                      relatedData.date as string | number | Date
                    ).toLocaleDateString()
                  : `ID: ${value}`);
            }
          } else {
            processedRow[key] = value ? `ID: ${value}` : "";
          }
        } else if (field.type === "date" && value) {
          const date =
            value instanceof Date
              ? value
              : new Date(value as string | number | Date);
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
          processedRow[key] =
            value && typeof value === "string"
              ? value.replace(/[#*_`[\]()]/g, "")
              : "";
        } else {
          processedRow[key] =
            value !== undefined && value !== null ? value : "";
        }
      }

      processedData.push(processedRow);
    }

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

    zip.file(`${filename}.csv`, finalCsv);

    let filesDownloaded = 0;
    for (const [filePath, localPath] of fileDownloadMap) {
      try {
        const base64Data = await ApiService.getFile(filePath);
        if (base64Data) {
          const response = await fetch(base64Data);
          const blob = await response.blob();
          zip.file(localPath, blob);
          filesDownloaded++;
        } else {
          console.warn(`Failed to get file: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Error getting file ${filePath}:`, error);
      }
    }

    const manifest = {
      totalFiles: fileDownloadMap.size,
      processedFiles: filesDownloaded,
      fileMap: Object.fromEntries(fileDownloadMap),
      timestamp: new Date().toISOString(),
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${filename}.zip`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data to ZIP:", error);
  }
}

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    return lastDot !== -1 ? pathname.substring(lastDot) : "";
  } catch {
    const lastDot = url.lastIndexOf(".");
    const lastSlash = url.lastIndexOf("/");
    if (lastDot !== -1 && lastDot > lastSlash) {
      return url.substring(lastDot);
    }
    return "";
  }
}

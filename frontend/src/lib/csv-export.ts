import Papa from "papaparse";
import JSZip from "jszip";
import { FieldDefinition } from "@/types/types";
import { ApiService } from "@/services/api";

interface ExportColumn {
  id: string;
  title: string;
  field?: FieldDefinition;
  kind?: "record_id" | "field" | "relation_display";
}

interface ExportedFileRecord {
  recordId: string;
  fieldKey: string;
  sourcePath: string;
  exportPath: string;
  originalName: string;
  fileIndex: number;
}

const RECORD_ID_COLUMN: ExportColumn = {
  id: "id",
  title: "id",
  kind: "record_id",
};

export async function exportToCSV(
  data: Record<string, unknown>[],
  fields: FieldDefinition[],
  filename: string = "export.csv",
  visibleColumns?: string[]
): Promise<string | null> {
  if (data.length === 0) {
    console.warn("No data to export");
    return null;
  }

  try {
    const columns = buildExportColumns(fields, visibleColumns);
    const processedData = data.map((row) => buildExportRow(row, columns));
    const finalCsv = buildCsv(processedData, columns);
    return await ApiService.saveExportBlob(
      new Blob([finalCsv], { type: "text/csv;charset=utf-8;" }),
      filename
    );
  } catch (error) {
    console.error("Error exporting data to CSV:", error);
    return null;
  }
}

export async function exportToZipWithFiles(
  data: Record<string, unknown>[],
  fields: FieldDefinition[],
  filename: string = "export",
  visibleColumns?: string[],
  datasetId?: string
): Promise<string | null> {
  if (data.length === 0) {
    console.warn("No data to export");
    return null;
  }

  try {
    const zip = new JSZip();
    const columns = buildExportColumns(fields, visibleColumns);
    const fileManifest: ExportedFileRecord[] = [];
    const processedData = data.map((row) =>
      buildExportRow(row, columns, {
        fileFieldFormatter: (field, value, recordId) => {
          const exportedFiles = createExportedFileRecords(
            value,
            field.key,
            recordId
          );

          exportedFiles.forEach((file) => fileManifest.push(file));

          if (field.type === "file-multiple") {
            return exportedFiles.map((file) => file.exportPath).join(";");
          }

          return exportedFiles[0]?.exportPath || "";
        },
      })
    );

    zip.file(`${filename}.csv`, buildCsv(processedData, columns));

    let filesDownloaded = 0;
    for (const fileRecord of fileManifest) {
      try {
        const base64Data = await ApiService.getFile(fileRecord.sourcePath);
        if (!base64Data) {
          console.warn(`Failed to get file: ${fileRecord.sourcePath}`);
          continue;
        }

        const response = await fetch(base64Data);
        const blob = await response.blob();
        zip.file(fileRecord.exportPath, blob);
        filesDownloaded++;
      } catch (error) {
        console.warn(`Error getting file ${fileRecord.sourcePath}:`, error);
      }
    }

    zip.file(
      "manifest.json",
      JSON.stringify(
        {
          formatVersion: 2,
          datasetId: datasetId || null,
          exportedAt: new Date().toISOString(),
          recordsFile: `${filename}.csv`,
          filesDirectory: "files",
          recordCount: processedData.length,
          totalFiles: fileManifest.length,
          processedFiles: filesDownloaded,
          columns: columns.map((column) => column.id),
          fileManifest,
        },
        null,
        2
      )
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    return await ApiService.saveExportBlob(zipBlob, `${filename}.zip`);
  } catch (error) {
    console.error("Error exporting data to ZIP:", error);
    return null;
  }
}

export function hasExportableFileFields(
  fields: FieldDefinition[],
  visibleColumns?: string[]
): boolean {
  const visibleColumnSet = visibleColumns ? new Set(visibleColumns) : null;

  return fields.some(
    (field) =>
      (field.type === "file" || field.type === "file-multiple") &&
      (!visibleColumnSet || visibleColumnSet.has(field.key))
  );
}

function buildExportColumns(
  fields: FieldDefinition[],
  visibleColumns?: string[]
): ExportColumn[] {
  const selectedFields = visibleColumns
    ? fields.filter((field) => visibleColumns.includes(field.key))
    : fields;

  const columns: ExportColumn[] = [RECORD_ID_COLUMN];

  selectedFields.forEach((field) => {
    columns.push({
      id: field.key,
      title: field.key,
      field,
      kind: "field",
    });

    if (field.isRelation) {
      columns.push({
        id: `${field.key}__display`,
        title: `${field.key}__display`,
        field,
        kind: "relation_display",
      });
    }
  });

  return columns;
}

function buildExportRow(
  row: Record<string, unknown>,
  columns: ExportColumn[],
  options?: {
    fileFieldFormatter?: (
      field: FieldDefinition,
      value: unknown,
      recordId: string
    ) => string;
  }
): Record<string, unknown> {
  const recordId = getRecordId(row);
  const processedRow: Record<string, unknown> = {
    id: recordId,
  };

  columns.forEach((column) => {
    if (column.kind === "record_id") {
      processedRow[column.id] = recordId;
      return;
    }

    if (!column.field) {
      return;
    }

    if (column.kind === "relation_display") {
      processedRow[column.id] = formatRelationDisplayValue(row, column.field);
      return;
    }

    processedRow[column.id] = formatFieldValue(row, column.field, recordId, {
      fileFieldFormatter: options?.fileFieldFormatter,
    });
  });

  return processedRow;
}

function formatFieldValue(
  row: Record<string, unknown>,
  field: FieldDefinition,
  recordId: string,
  options?: {
    fileFieldFormatter?: (
      field: FieldDefinition,
      value: unknown,
      recordId: string
    ) => string;
  }
): unknown {
  const key = field.key;
  const value = row[key];

  if (field.type === "file" || field.type === "file-multiple") {
    if (options?.fileFieldFormatter) {
      return options.fileFieldFormatter(field, value, recordId);
    }

    const exportedFiles = createExportedFileRecords(value, key, recordId);

    if (field.type === "file-multiple") {
      return exportedFiles.map((file) => file.exportPath).join(";");
    }

    return exportedFiles[0]?.exportPath || "";
  }

  if (field.isRelation) {
    return serializeRawValue(value);
  }

  if (field.type === "date") {
    return serializeDateValue(value);
  }

  if (field.type === "boolean" && typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (field.type === "markdown" && typeof value === "string") {
    return value;
  }

  return String(serializeRawValue(value));
}

function formatRelationDisplayValue(
  row: Record<string, unknown>,
  field: FieldDefinition
): string {
  const key = field.key;
  const value = row[key];
  const relatedDataKey = `${key}_data`;
  const relatedData = row[relatedDataKey] as Record<string, unknown> | undefined;

  if (relatedData) {
    if (field.displayField && relatedData[field.displayField]) {
      if (
        field.secondaryDisplayField &&
        relatedData[field.secondaryDisplayField]
      ) {
        return `${String(relatedData[field.displayField])} (${String(
          relatedData[field.secondaryDisplayField]
        )})`;
      }

      return String(relatedData[field.displayField]);
    }

    return String(
      relatedData.name ||
        relatedData.title ||
        relatedData.displayName ||
        relatedData.label ||
        relatedData.date ||
        value ||
        ""
    );
  }

  return value !== undefined && value !== null ? String(value) : "";
}

function serializeDateValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

  return String(serializeRawValue(value));
}

function serializeRawValue(value: unknown): unknown {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildCsv(
  processedData: Record<string, unknown>[],
  columns: ExportColumn[]
): string {
  const papaConfig = {
    header: true,
    columns: columns.map((column) => column.id),
    newline: "\r\n",
  };

  const csv = Papa.unparse(processedData, papaConfig);
  const headerRow = columns.map((column) => `"${column.title}"`).join(",");
  const rows = csv.split("\r\n");
  rows[0] = headerRow;

  return rows.join("\r\n");
}

function createExportedFileRecords(
  value: unknown,
  fieldKey: string,
  recordId: string
): ExportedFileRecord[] {
  const fileEntries = extractFileEntries(value);

  return fileEntries.map((file, index) => {
    const exportPath = buildExportFilePath(
      recordId,
      fieldKey,
      file.originalName,
      file.sourcePath,
      index
    );

    return {
      recordId,
      fieldKey,
      sourcePath: file.sourcePath,
      exportPath,
      originalName: file.originalName,
      fileIndex: index,
    };
  });
}

function extractFileEntries(
  value: unknown
): Array<{ sourcePath: string; originalName: string }> {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .map((entry, index) => {
      if (typeof entry === "string") {
        return {
          sourcePath: entry,
          originalName: getFileNameFromPath(entry) || `file-${index + 1}`,
        };
      }

      if (entry && typeof entry === "object") {
        const sourcePath =
          String(
            (entry as Record<string, unknown>).src ||
              (entry as Record<string, unknown>).url ||
              (entry as Record<string, unknown>).path ||
              ""
          ) || "";

        if (!sourcePath) {
          return null;
        }

        const explicitName = (entry as Record<string, unknown>).name;

        return {
          sourcePath,
          originalName:
            (typeof explicitName === "string" && explicitName) ||
            getFileNameFromPath(sourcePath) ||
            `file-${index + 1}`,
        };
      }

      return null;
    })
    .filter(
      (
        entry
      ): entry is {
        sourcePath: string;
        originalName: string;
      } => Boolean(entry?.sourcePath)
    );
}

function buildExportFilePath(
  recordId: string,
  fieldKey: string,
  originalName: string,
  sourcePath: string,
  fileIndex: number
): string {
  const sanitizedRecordId = sanitizePathSegment(recordId);
  const sanitizedFieldKey = sanitizePathSegment(fieldKey);
  const normalizedFileName = normalizeFileName(
    originalName,
    sourcePath,
    `file-${fileIndex + 1}`
  );

  return `files/${sanitizedRecordId}/${sanitizedFieldKey}/${String(
    fileIndex + 1
  ).padStart(2, "0")}_${normalizedFileName}`;
}

function normalizeFileName(
  originalName: string,
  sourcePath: string,
  fallbackBase: string
): string {
  const trimmedName = originalName.trim();
  const existingExtension = getFileExtension(trimmedName);
  const fallbackExtension = getFileExtension(sourcePath);
  const safeBaseName = sanitizePathSegment(
    trimmedName.replace(/\.[^/.]+$/, "") || fallbackBase
  );
  const extension = existingExtension || fallbackExtension;

  return `${safeBaseName}${extension}`;
}

function getRecordId(row: Record<string, unknown>): string {
  const rawId = row.id;

  if (typeof rawId === "string" && rawId.trim()) {
    return rawId;
  }

  if (typeof rawId === "number") {
    return String(rawId);
  }

  return "unknown-record";
}

function getFileNameFromPath(path: string): string {
  try {
    const pathname = new URL(path).pathname;
    return pathname.split("/").pop() || "";
  } catch {
    return path.split("/").pop() || "";
  }
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(path: string): string {
  try {
    const pathname = new URL(path).pathname;
    const lastDot = pathname.lastIndexOf(".");
    return lastDot !== -1 ? pathname.substring(lastDot) : "";
  } catch {
    const lastDot = path.lastIndexOf(".");
    const lastSlash = path.lastIndexOf("/");
    if (lastDot !== -1 && lastDot > lastSlash) {
      return path.substring(lastDot);
    }
    return "";
  }
}

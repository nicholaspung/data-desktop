import { FieldDefinition } from "@/types/types";
import Papa from "papaparse";
import { ApiService } from "@/services/api";
import { getNestedValue } from "./utils";
import { formatDate } from "./date-utils";

export async function parseCSV(
  file: File,
  fieldDefinitions: FieldDefinition[]
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const fieldMap = new Map<string, FieldDefinition>();
    fieldDefinitions.forEach((field) => {
      fieldMap.set(field.key, field);
    });

    const relationFields = fieldDefinitions.filter(
      (field) => field.isRelation && field.relatedDataset
    );

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => {
        return header.trim().toLowerCase();
      },
      complete: async (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);

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

        if (!results.data || results.data.length === 0) {
          reject(new Error("No data found in CSV file"));
          return;
        }

        try {
          const relationData = await loadRelationData(relationFields);

          const processedData = (results.data as Record<string, any>[]).map(
            (row: Record<string, any>, index: number) => {
              const processedRow: Record<string, any> = {
                id: crypto.randomUUID(),
              };

              fieldDefinitions.forEach((field) => {
                try {
                  let value =
                    row[field.key] ??
                    row[field.key.toLowerCase()] ??
                    row[field.key.toUpperCase()];

                  if (value === undefined || value === null) {
                    switch (field.type) {
                      case "number":
                      case "percentage":
                        processedRow[field.key] = 0;
                        break;
                      case "boolean":
                        processedRow[field.key] = false;
                        break;
                      case "date":
                        processedRow[field.key] = new Date().toISOString();
                        break;
                      case "markdown":
                        if (typeof value !== "string") {
                          processedRow[field.key] = String(value);
                        } else {
                          processedRow[field.key] = value;
                        }
                        break;
                      case "text":
                      default:
                        processedRow[field.key] = "";
                        break;
                    }
                    return;
                  }

                  if (field.isRelation && field.relatedDataset) {
                    const relationInfo = relationData[field.key];
                    if (relationInfo && relationInfo.idSet.has(value)) {
                      processedRow[field.key] = value;
                      return;
                    }

                    if (relationInfo && typeof value === "string") {
                      const normalizedValue = value.toLowerCase().trim();

                      if (
                        field.displayField &&
                        field.displayFieldType === "date"
                      ) {
                        try {
                          const dateObj = new Date(normalizedValue);
                          if (!isNaN(dateObj.getTime())) {
                            const isoDate = dateObj
                              .toISOString()
                              .split("T")[0]
                              .toLowerCase();
                            const matchedIdFromIso =
                              relationInfo.displayToIdMap.get(isoDate);
                            if (matchedIdFromIso) {
                              processedRow[field.key] = matchedIdFromIso;
                              return;
                            }

                            const month = dateObj.getMonth() + 1;
                            const day = dateObj.getDate();
                            const year = dateObj.getFullYear();
                            const mmddyyyy =
                              `${month}/${day}/${year}`.toLowerCase();
                            const matchedIdFromMmDdYyyy =
                              relationInfo.displayToIdMap.get(mmddyyyy);
                            if (matchedIdFromMmDdYyyy) {
                              processedRow[field.key] = matchedIdFromMmDdYyyy;
                              return;
                            }
                          }
                        } catch (e: any) {
                          console.error(`Error: ${e}`);
                        }
                      }

                      const exactMatchId =
                        relationInfo.displayToIdMap.get(normalizedValue);
                      if (exactMatchId) {
                        processedRow[field.key] = exactMatchId;
                        return;
                      }

                      if (field.displayField && field.secondaryDisplayField) {
                        const openParenIndex = normalizedValue.lastIndexOf("(");

                        if (
                          openParenIndex > 0 &&
                          normalizedValue.endsWith(")")
                        ) {
                          const primaryValue = normalizedValue
                            .substring(0, openParenIndex)
                            .trim();
                          const secondaryValue = normalizedValue
                            .substring(
                              openParenIndex + 1,
                              normalizedValue.length - 1
                            )
                            .trim();

                          const combinedKey = `${primaryValue} - ${secondaryValue}`;
                          const combinedParenKey = `${primaryValue} (${secondaryValue})`;

                          const combinedMatch =
                            relationInfo.displayToIdMap.get(combinedKey) ||
                            relationInfo.displayToIdMap.get(combinedParenKey);

                          if (combinedMatch) {
                            processedRow[field.key] = combinedMatch;
                            return;
                          }

                          for (const [
                            ,
                            id,
                          ] of relationInfo.displayToIdMap.entries()) {
                            const records = relationInfo.records || [];
                            const matchingRecord = records.find(
                              (record) => record.id === id
                            );

                            if (matchingRecord) {
                              const primaryFieldValue = field.displayField
                                ? getNestedValue(
                                    matchingRecord,
                                    field.displayField
                                  )
                                : null;

                              const matchingSecondaryValue =
                                field.secondaryDisplayField
                                  ? getNestedValue(
                                      matchingRecord,
                                      field.secondaryDisplayField
                                    )
                                  : null;

                              if (
                                primaryFieldValue &&
                                matchingSecondaryValue &&
                                primaryFieldValue.toString().toLowerCase() ===
                                  primaryValue &&
                                formatDate(
                                  matchingSecondaryValue
                                ).toLowerCase() === secondaryValue
                              ) {
                                processedRow[field.key] = id;
                                return;
                              }
                            }
                          }
                        }
                      }

                      if (field.secondaryDisplayField) {
                        const records = relationInfo.records || [];
                        for (const record of records) {
                          const primaryFieldValue = field.displayField
                            ? getNestedValue(record, field.displayField)
                            : null;
                          const secondaryFieldValue = getNestedValue(
                            record,
                            field.secondaryDisplayField
                          );

                          if (primaryFieldValue && secondaryFieldValue) {
                            let primaryMatch = false;
                            let secondaryMatch = false;

                            if (
                              primaryFieldValue.toString().toLowerCase() ===
                              normalizedValue
                            ) {
                              primaryMatch = true;
                            }

                            if (field.secondaryDisplayFieldType === "date") {
                              try {
                                const inputDate = new Date(normalizedValue);
                                const recordDate = new Date(
                                  secondaryFieldValue
                                );

                                if (
                                  !isNaN(inputDate.getTime()) &&
                                  !isNaN(recordDate.getTime())
                                ) {
                                  const inputLocalDate =
                                    inputDate.toLocaleDateString("en-CA");
                                  const recordLocalDate =
                                    recordDate.toLocaleDateString("en-CA");
                                  secondaryMatch =
                                    inputLocalDate === recordLocalDate;
                                } else {
                                  secondaryMatch =
                                    secondaryFieldValue
                                      .toString()
                                      .toLowerCase() === normalizedValue;
                                }
                              } catch (e) {
                                console.error(`Error parsing date: ${e}`);
                                secondaryMatch =
                                  secondaryFieldValue
                                    .toString()
                                    .toLowerCase() === normalizedValue;
                              }
                            } else {
                              secondaryMatch =
                                secondaryFieldValue.toString().toLowerCase() ===
                                normalizedValue;
                            }

                            if (primaryMatch || secondaryMatch) {
                              processedRow[field.key] = record.id;
                              return;
                            }
                          }
                        }
                      }

                      processedRow[field.key] = value;
                      console.warn(
                        `No relation match found for ${field.key}: "${value}"`
                      );
                    } else {
                      processedRow[field.key] = value;
                    }
                    return;
                  }

                  switch (field.type) {
                    case "file":
                      processedRow[field.key] = "";
                      break;
                    case "date":
                      if (value && !(value instanceof Date)) {
                        let parsedDate: Date | null = null;

                        if (typeof value === "string") {
                          const formats = [
                            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
                            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
                            /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
                          ];

                          for (const format of formats) {
                            const match = value.match(format);
                            if (match) {
                              let year, month, day;

                              if (
                                format === formats[0] ||
                                format === formats[2]
                              ) {
                                month = parseInt(match[1], 10);
                                day = parseInt(match[2], 10);
                                year = parseInt(match[3], 10);
                              } else {
                                year = parseInt(match[1], 10);
                                month = parseInt(match[2], 10);
                                day = parseInt(match[3], 10);
                              }

                              parsedDate = new Date(year, month - 1, day);
                              if (!isNaN(parsedDate.getTime())) {
                                break;
                              }
                            }
                          }

                          if (!parsedDate || isNaN(parsedDate.getTime())) {
                            const fallbackDate = new Date(value);
                            if (!isNaN(fallbackDate.getTime())) {
                              const offset = fallbackDate.getTimezoneOffset();
                              parsedDate = new Date(
                                fallbackDate.getTime() + offset * 60 * 1000
                              );
                            }
                          }
                        } else if (typeof value === "number") {
                          parsedDate = new Date(value);
                        }

                        if (!parsedDate || isNaN(parsedDate.getTime())) {
                          parsedDate = new Date();
                          console.warn(
                            `Row ${index + 1}: Invalid date "${value}" for field "${field.key}", using current date instead.`
                          );
                        }

                        processedRow[field.key] = parsedDate.toISOString();
                      } else if (value instanceof Date) {
                        processedRow[field.key] = value.toISOString();
                      } else {
                        processedRow[field.key] = value;
                      }
                      break;

                    case "boolean":
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
                      if (typeof value === "string") {
                        value = value.replace(/[%,$]/g, "").trim();

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

                      if (
                        field.type === "percentage" &&
                        typeof processedRow[field.key] === "number"
                      ) {
                        if (processedRow[field.key] < 0) {
                          processedRow[field.key] = 0;
                        } else if (processedRow[field.key] > 100) {
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

                  switch (field.type) {
                    case "number":
                    case "percentage":
                      processedRow[field.key] = 0;
                      break;
                    case "boolean":
                      processedRow[field.key] = false;
                      break;
                    case "date":
                      processedRow[field.key] = new Date().toISOString();
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

async function loadRelationData(relationFields: FieldDefinition[]): Promise<
  Record<
    string,
    {
      idSet: Set<string>;
      displayToIdMap: Map<string, string>;
      records: Record<string, any>[];
    }
  >
> {
  const result: Record<
    string,
    {
      idSet: Set<string>;
      displayToIdMap: Map<string, string>;
      records: Record<string, any>[];
    }
  > = {};

  for (const field of relationFields) {
    if (!field.relatedDataset || !field.key) continue;

    try {
      const records = await ApiService.getRecords(field.relatedDataset);

      const idSet = new Set<string>();

      const displayToIdMap = new Map<string, string>();

      records.forEach((record: any) => {
        const id = record.id;
        idSet.add(id);

        const displayFieldValue = field.displayField
          ? getNestedValue(record, field.displayField)
          : null;

        if (field.displayField && displayFieldValue) {
          let displayValue;

          if (field.displayFieldType === "date" && displayFieldValue) {
            const dateObj = new Date(displayFieldValue);
            if (!isNaN(dateObj.getTime())) {
              displayValue = dateObj.toISOString().split("T")[0].toLowerCase();

              const month = dateObj.getMonth() + 1;
              const day = dateObj.getDate();
              const year = dateObj.getFullYear();

              displayToIdMap.set(`${month}/${day}/${year}`.toLowerCase(), id);

              displayToIdMap.set(`${month}-${day}-${year}`.toLowerCase(), id);

              const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ];
              displayToIdMap.set(
                `${monthNames[month - 1]} ${day}, ${year}`.toLowerCase(),
                id
              );
            } else {
              displayValue = displayFieldValue.toString().toLowerCase();
            }
          } else {
            displayValue = displayFieldValue.toString().toLowerCase();
          }

          displayToIdMap.set(displayValue, id);

          const secondaryFieldValue = field.secondaryDisplayField
            ? getNestedValue(record, field.secondaryDisplayField)
            : null;

          if (field.secondaryDisplayField && secondaryFieldValue) {
            let secondaryValue;

            if (
              field.secondaryDisplayFieldType === "date" &&
              secondaryFieldValue
            ) {
              const dateObj = new Date(secondaryFieldValue);
              if (!isNaN(dateObj.getTime())) {
                secondaryValue = dateObj
                  .toISOString()
                  .split("T")[0]
                  .toLowerCase();
              } else {
                secondaryValue = secondaryFieldValue.toString().toLowerCase();
              }
            } else {
              secondaryValue = secondaryFieldValue.toString().toLowerCase();
            }

            const combinedDash = `${displayValue} - ${secondaryValue}`;
            const combinedParen = `${displayValue} (${secondaryValue})`;

            displayToIdMap.set(secondaryValue, id);
            displayToIdMap.set(combinedDash, id);
            displayToIdMap.set(combinedParen, id);
          }
        }

        ["name", "title", "label", "displayName"].forEach((key) => {
          if (record[key]) {
            displayToIdMap.set(record[key].toString().toLowerCase(), id);
          }
        });
      });

      result[field.key] = {
        idSet,
        displayToIdMap,
        records,
      };
    } catch (error) {
      console.error(
        `Error loading relation data for ${field.relatedDataset}:`,
        error
      );
      result[field.key] = {
        idSet: new Set(),
        displayToIdMap: new Map(),
        records: [],
      };
    }
  }

  return result;
}

export async function validateCSV(
  file: File,
  expectedFields: string[]
): Promise<{ isValid: boolean; missingFields: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header.trim().toLowerCase();
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
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

export function createCSVTemplate(fields: FieldDefinition[]): string {
  const headers = fields.map((field) => field.key);

  const exampleRow: Record<string, any> = {};
  const headerDesc: Record<string, string> = {};

  fields.forEach((field) => {
    headerDesc[field.key] =
      field.displayName + (field.description ? ` - ${field.description}` : "");

    if (field.isRelation && field.relatedDataset) {
      let example = "";

      if (field.displayField) {
        if (field.displayFieldType === "date") {
          const today = new Date();

          const formattedDate = today.toISOString().split("T")[0];
          example = `${formattedDate}`;

          headerDesc[field.key] +=
            ` (Enter date in YYYY-MM-DD format or MM/DD/YYYY, the system will match to the correct record)`;
        } else if (field.secondaryDisplayField) {
          example = `Primary Display (Secondary Display)`;
          headerDesc[field.key] +=
            ` (Use format "Primary Display (Secondary Display)" to match records with secondary display fields)`;
        } else {
          example = `Enter ${field.displayName} value`;
        }
      } else {
        example = "Enter name or ID";
      }

      exampleRow[field.key] = example;
      if (
        !headerDesc[field.key].includes("(Enter") &&
        !field.displayFieldType
      ) {
        headerDesc[field.key] += " (Enter value, the system will match to ID)";
      }
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
        case "file":
          exampleRow[field.key] = "[Image]";
          headerDesc[field.key] +=
            " (Images cannot be imported/exported via CSV)";
          break;
      }
    }
  });

  const descriptionRow: Record<string, string> = {};
  headers.forEach((header) => {
    descriptionRow[header] = headerDesc[header] || "";
  });

  const csvContent = Papa.unparse({
    fields: headers,
    data: [descriptionRow, exampleRow],
  });

  return csvContent;
}

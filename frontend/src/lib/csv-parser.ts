import { FieldDefinition } from "@/types/types";
import Papa from "papaparse";
import { ApiService } from "@/services/api";

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
                        processedRow[field.key] = new Date();
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
                              console.log(
                                `Found date match using ISO format: "${value}" → "${isoDate}" → ID: ${matchedIdFromIso}`
                              );
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
                              console.log(
                                `Found date match using MM/DD/YYYY format: "${value}" → "${mmddyyyy}" → ID: ${matchedIdFromMmDdYyyy}`
                              );
                              return;
                            }
                          }
                        } catch (e: any) {
                          console.log(`Failed to parse date: "${value}"`);
                          console.error(`Error: ${e}`);
                        }
                      }

                      const matchedId =
                        relationInfo.displayToIdMap.get(normalizedValue);

                      if (matchedId) {
                        processedRow[field.key] = matchedId;
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
                            console.log(
                              `Found combined match for "${value}" with primary "${primaryValue}" and secondary "${secondaryValue}"`
                            );
                            return;
                          }

                          for (const [
                            displayKey,
                            id,
                          ] of relationInfo.displayToIdMap.entries()) {
                            if (displayKey.includes(primaryValue)) {
                              const records = relationInfo.records || [];
                              const matchingRecord = records.find(
                                (record) => record.id === id
                              );

                              if (
                                matchingRecord &&
                                matchingRecord[field.secondaryDisplayField] &&
                                matchingRecord[field.secondaryDisplayField]
                                  .toString()
                                  .toLowerCase() === secondaryValue
                              ) {
                                processedRow[field.key] = id;
                                console.log(
                                  `Found record match with primary "${primaryValue}" and confirmed secondary "${secondaryValue}"`
                                );
                                return;
                              }
                            }
                          }
                        }
                      }

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
                    case "image":
                      processedRow[field.key] = "";
                      break;
                    case "date":
                      if (value && !(value instanceof Date)) {
                        let parsedDate: Date | null = null;

                        if (typeof value === "string") {
                          parsedDate = new Date(value);

                          if (isNaN(parsedDate.getTime())) {
                            const formats = [
                              /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                              /(\d{4})-(\d{1,2})-(\d{1,2})/,
                              /(\d{1,2})-(\d{1,2})-(\d{4})/,
                            ];

                            for (const format of formats) {
                              const match = value.match(format);
                              if (match) {
                                const dateObj = new Date(value);
                                if (!isNaN(dateObj.getTime())) {
                                  parsedDate = dateObj;
                                  break;
                                }
                              }
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

                        processedRow[field.key] = parsedDate;
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

        if (field.displayField && record[field.displayField]) {
          let displayValue;

          if (field.displayFieldType === "date" && record[field.displayField]) {
            const dateObj = new Date(record[field.displayField]);
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
              displayValue = record[field.displayField]
                .toString()
                .toLowerCase();
            }
          } else {
            displayValue = record[field.displayField].toString().toLowerCase();
          }

          displayToIdMap.set(displayValue, id);

          if (
            field.secondaryDisplayField &&
            record[field.secondaryDisplayField]
          ) {
            let secondaryValue;

            if (
              field.secondaryDisplayFieldType === "date" &&
              record[field.secondaryDisplayField]
            ) {
              const dateObj = new Date(record[field.secondaryDisplayField]);
              if (!isNaN(dateObj.getTime())) {
                secondaryValue = dateObj
                  .toISOString()
                  .split("T")[0]
                  .toLowerCase();
              } else {
                secondaryValue = record[field.secondaryDisplayField]
                  .toString()
                  .toLowerCase();
              }
            } else {
              secondaryValue = record[field.secondaryDisplayField]
                .toString()
                .toLowerCase();
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
          example = `Name (Secondary Value)`;
          headerDesc[field.key] +=
            ` (You can use format "Primary (Secondary)" to match by both fields)`;
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
        case "image":
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

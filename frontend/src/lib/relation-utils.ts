// src/lib/relation-utils.ts
import { FieldDefinition } from "@/types/types";
import { ApiService } from "@/services/api";

/**
 * Interface for representing a relation option
 */
export interface RelationOption {
  id: string;
  label: string;
  displayValue: string;
}

/**
 * Interface for relation data mapping
 */
export interface RelationDataMap {
  [key: string]: {
    options: RelationOption[];
    loading: boolean;
  };
}

/**
 * Fetches relation options for a set of relation fields
 * @param fields List of fields to check for relations
 * @returns Object with relation options for each relation field
 */
export async function fetchRelationOptions(
  fields: FieldDefinition[]
): Promise<RelationDataMap> {
  // Create result object
  const result: RelationDataMap = {};

  // Find all relation fields
  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  // Initialize result structure
  relationFields.forEach((field) => {
    result[field.key] = {
      options: [],
      loading: true,
    };
  });

  // Fetch data for each relation field
  await Promise.all(
    relationFields.map(async (field) => {
      if (!field.relatedDataset) return;

      try {
        const records = await ApiService.getRecords(field.relatedDataset);

        // Transform records to options with id and label
        const options = records.map((record: any) => {
          let label = "";
          let displayValue = "";

          if (field.displayField && record[field.displayField] !== undefined) {
            displayValue = record[field.displayField] || "";
            label = record[field.displayField] || "";

            // Add secondary field if available
            if (
              field.secondaryDisplayField &&
              record[field.secondaryDisplayField] !== undefined &&
              record[field.secondaryDisplayField] !== ""
            ) {
              label += ` (${record[field.secondaryDisplayField]})`;
            }
          }
          // Generic fallback
          else {
            displayValue = record.name || record.title || "";
            label = record.name || record.title || `ID: ${record.id}`;
          }

          return {
            id: record.id,
            label,
            displayValue,
          };
        });

        result[field.key] = {
          options,
          loading: false,
        };
      } catch (error) {
        console.error(
          `Error fetching relation data for ${field.relatedDataset}:`,
          error
        );
        result[field.key] = {
          options: [],
          loading: false,
        };
      }
    })
  );

  return result;
}

/**
 * Resolves display values to relation IDs for a set of records
 * @param records Records with potential relation display values
 * @param fields All field definitions
 * @returns Records with resolved relation IDs
 */
export async function resolveRelationReferences(
  records: Record<string, any>[],
  fields: FieldDefinition[]
): Promise<Record<string, any>[]> {
  // Find relation fields
  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  // If no relation fields, return original records
  if (relationFields.length === 0) return [...records];

  // Create copy of records to modify
  const resolvedRecords = [...records];

  // Fetch relation data for all fields
  const relationData = await fetchRelationOptions(fields);

  // Process each record
  for (const record of resolvedRecords) {
    // Process each relation field
    for (const field of relationFields) {
      const value = record[field.key];

      // Skip empty values
      if (!value || (typeof value === "string" && value.trim() === ""))
        continue;

      // Skip if already a valid ID (already found in options)
      const options = relationData[field.key]?.options || [];
      if (options.some((option) => option.id === value)) continue;

      // If it's a string, try to match by display value or label
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase().trim();

        // Special handling for date-based relation fields
        if (field.displayField && field.displayFieldType === "date") {
          try {
            // Try to parse the date from the string value
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              // Format date in multiple formats for better matching
              const isoDate = dateObj.toISOString().split("T")[0].toLowerCase();
              const month = dateObj.getMonth() + 1;
              const day = dateObj.getDate();
              const year = dateObj.getFullYear();

              // Try different date formats
              const dateFormats = [
                isoDate, // YYYY-MM-DD
                `${month}/${day}/${year}`.toLowerCase(), // MM/DD/YYYY
                `${month}-${day}-${year}`.toLowerCase(), // MM-DD-YYYY
                value.toLowerCase().trim(), // Original value
              ];

              // Try to find a match using any of these formats
              for (const dateFormat of dateFormats) {
                const dateMatch = options.find(
                  (option) => option.displayValue.toLowerCase() === dateFormat
                );

                if (dateMatch) {
                  record[field.key] = dateMatch.id;
                  console.log(
                    `Found date match for "${value}" with format "${dateFormat}"`
                  );
                  continue;
                }
              }
            }
          } catch (e) {
            console.log(`Error parsing date: ${e}`);
            // Continue with normal matching if date parsing fails
          }
        }

        // Handle parentheses pattern first - "PrimaryValue (SecondaryValue)"
        if (field.secondaryDisplayField) {
          // Find the last opening parenthesis
          const openParenIndex = lowerValue.lastIndexOf("(");

          // Check if we have both opening and closing parentheses
          if (openParenIndex > 0 && lowerValue.endsWith(")")) {
            // Extract primary and secondary values
            const primaryValue = lowerValue.substring(0, openParenIndex).trim();
            const secondaryValue = lowerValue
              .substring(openParenIndex + 1, lowerValue.length - 1)
              .trim();

            // Look for a record with matching primary and secondary values
            const exactMatch = options.find((option) => {
              // Check if label includes both primary and secondary in expected format
              const optionLabel = option.label.toLowerCase();
              const hasPrimary = optionLabel.includes(primaryValue);
              const hasSecondary = optionLabel.includes(secondaryValue);
              const hasParenFormat = optionLabel.includes(
                `(${secondaryValue})`
              );
              const hasDashFormat = optionLabel.includes(`- ${secondaryValue}`);

              return (
                hasPrimary && hasSecondary && (hasParenFormat || hasDashFormat)
              );
            });

            if (exactMatch) {
              record[field.key] = exactMatch.id;
              console.log(
                `Found combined match for "${value}" with "${exactMatch.label}"`
              );
              continue;
            }
          }
        }

        // Look for exact match if not a parentheses pattern or if no match found
        const exactMatch = options.find(
          (option) =>
            option.displayValue.toLowerCase() === lowerValue ||
            option.label.toLowerCase() === lowerValue
        );

        if (exactMatch) {
          record[field.key] = exactMatch.id;
          continue;
        }

        // Try partial matching
        const partialMatch = options.find(
          (option) =>
            option.displayValue.toLowerCase().includes(lowerValue) ||
            lowerValue.includes(option.displayValue.toLowerCase()) ||
            option.label.toLowerCase().includes(lowerValue) ||
            lowerValue.includes(option.label.toLowerCase())
        );

        if (partialMatch) {
          record[field.key] = partialMatch.id;
          console.log(
            `Found partial match for "${value}" with "${partialMatch.label}"`
          );
          continue;
        }
      }

      // If no match found, leave as is (will be handled by validation later)
      console.warn(`No relation match found for ${field.key}: "${value}"`);
    }
  }

  return resolvedRecords;
}

/**
 * Creates a relation lookup function that can efficiently find relation IDs
 * from display values
 * @param relationData Relation data mapping
 * @returns Function that resolves display values to IDs
 */
export function createRelationLookup(relationData: RelationDataMap) {
  return (
    fieldKey: string,
    displayValue: string,
    fieldDef?: FieldDefinition
  ): string | null => {
    const data = relationData[fieldKey];
    if (!data || !data.options) return null;

    const lowerValue = displayValue.toLowerCase().trim();

    // Special handling for date-based relation fields
    if (fieldDef?.displayFieldType === "date") {
      try {
        // Try to parse the date
        const dateObj = new Date(displayValue);
        if (!isNaN(dateObj.getTime())) {
          // Try different date formats for matching
          const isoDate = dateObj.toISOString().split("T")[0].toLowerCase();
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();

          // MM/DD/YYYY format
          const mmddyyyy = `${month}/${day}/${year}`.toLowerCase();

          // Try matching with ISO format
          const exactMatchIso = data.options.find(
            (option) => option.displayValue.toLowerCase() === isoDate
          );
          if (exactMatchIso) return exactMatchIso.id;

          // Try matching with MM/DD/YYYY format
          const exactMatchMmDdYyyy = data.options.find(
            (option) => option.displayValue.toLowerCase() === mmddyyyy
          );
          if (exactMatchMmDdYyyy) return exactMatchMmDdYyyy.id;
        }
      } catch (e) {
        console.log(`Error parsing date for lookup: ${e}`);
        // Continue with regular matching if date parsing fails
      }
    }

    // Check for parentheses pattern first - "PrimaryValue (SecondaryValue)"
    const openParenIndex = lowerValue.lastIndexOf("(");
    if (openParenIndex > 0 && lowerValue.endsWith(")")) {
      // Extract primary and secondary values
      const primaryValue = lowerValue.substring(0, openParenIndex).trim();
      const secondaryValue = lowerValue
        .substring(openParenIndex + 1, lowerValue.length - 1)
        .trim();

      // Look for a record with matching primary and secondary values
      const exactMatch = data.options.find((option) => {
        const optionLabel = option.label.toLowerCase();
        return (
          optionLabel.includes(primaryValue) &&
          optionLabel.includes(secondaryValue) &&
          (optionLabel.includes(`(${secondaryValue})`) ||
            optionLabel.includes(`- ${secondaryValue}`))
        );
      });

      if (exactMatch) return exactMatch.id;
    }

    // Try exact matches next
    const exactMatch = data.options.find(
      (option) =>
        option.displayValue.toLowerCase() === lowerValue ||
        option.label.toLowerCase() === lowerValue
    );

    if (exactMatch) return exactMatch.id;

    // Try partial matches last
    const partialMatch = data.options.find(
      (option) =>
        option.displayValue.toLowerCase().includes(lowerValue) ||
        lowerValue.includes(option.displayValue.toLowerCase()) ||
        option.label.toLowerCase().includes(lowerValue) ||
        lowerValue.includes(option.label.toLowerCase())
    );

    return partialMatch ? partialMatch.id : null;
  };
}

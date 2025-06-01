import { FieldDefinition } from "@/types/types";
import { ApiService } from "@/services/api";

export interface RelationOption {
  id: string;
  label: string;
  displayValue: string;
}

export interface RelationDataMap {
  [key: string]: {
    options: RelationOption[];
    loading: boolean;
  };
}

export async function fetchRelationOptions(
  fields: FieldDefinition[]
): Promise<RelationDataMap> {
  const result: RelationDataMap = {};

  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  relationFields.forEach((field) => {
    result[field.key] = {
      options: [],
      loading: true,
    };
  });

  await Promise.all(
    relationFields.map(async (field) => {
      if (!field.relatedDataset) return;

      try {
        const records = await ApiService.getRecords(field.relatedDataset);

        const options = records.map((record: any) => {
          let label = "";
          let displayValue = "";

          if (field.displayField && record[field.displayField] !== undefined) {
            displayValue = record[field.displayField] || "";
            label = record[field.displayField] || "";

            if (
              field.secondaryDisplayField &&
              record[field.secondaryDisplayField] !== undefined &&
              record[field.secondaryDisplayField] !== ""
            ) {
              label += ` (${record[field.secondaryDisplayField]})`;
            }
          } else {
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

export async function resolveRelationReferences(
  records: Record<string, any>[],
  fields: FieldDefinition[]
): Promise<Record<string, any>[]> {
  const relationFields = fields.filter(
    (field) => field.isRelation && field.relatedDataset
  );

  if (relationFields.length === 0) return [...records];

  const resolvedRecords = [...records];

  const relationData = await fetchRelationOptions(fields);

  for (const record of resolvedRecords) {
    for (const field of relationFields) {
      const value = record[field.key];

      if (!value || (typeof value === "string" && value.trim() === ""))
        continue;

      const options = relationData[field.key]?.options || [];
      if (options.some((option) => option.id === value)) continue;

      if (typeof value === "string") {
        const lowerValue = value.toLowerCase().trim();

        if (field.displayField && field.displayFieldType === "date") {
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              const isoDate = dateObj.toISOString().split("T")[0].toLowerCase();
              const month = dateObj.getMonth() + 1;
              const day = dateObj.getDate();
              const year = dateObj.getFullYear();

              const dateFormats = [
                isoDate,
                `${month}/${day}/${year}`.toLowerCase(),
                `${month}-${day}-${year}`.toLowerCase(),
                value.toLowerCase().trim(),
              ];

              for (const dateFormat of dateFormats) {
                const dateMatch = options.find(
                  (option) => option.displayValue.toLowerCase() === dateFormat
                );

                if (dateMatch) {
                  record[field.key] = dateMatch.id;
                  continue;
                }
              }
            }
          } catch (e) {
            console.error(`Error parsing date: ${e}`);
          }
        }

        if (field.secondaryDisplayField) {
          const openParenIndex = lowerValue.lastIndexOf("(");

          if (openParenIndex > 0 && lowerValue.endsWith(")")) {
            const primaryValue = lowerValue.substring(0, openParenIndex).trim();
            const secondaryValue = lowerValue
              .substring(openParenIndex + 1, lowerValue.length - 1)
              .trim();

            const exactMatch = options.find((option) => {
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
              continue;
            }
          }
        }

        const exactMatch = options.find(
          (option) =>
            option.displayValue.toLowerCase() === lowerValue ||
            option.label.toLowerCase() === lowerValue
        );

        if (exactMatch) {
          record[field.key] = exactMatch.id;
          continue;
        }

        const partialMatch = options.find(
          (option) =>
            option.displayValue.toLowerCase().includes(lowerValue) ||
            lowerValue.includes(option.displayValue.toLowerCase()) ||
            option.label.toLowerCase().includes(lowerValue) ||
            lowerValue.includes(option.label.toLowerCase())
        );

        if (partialMatch) {
          record[field.key] = partialMatch.id;
          continue;
        }
      }

      console.warn(`No relation match found for ${field.key}: "${value}"`);
    }
  }

  return resolvedRecords;
}

export function createRelationLookup(relationData: RelationDataMap) {
  return (
    fieldKey: string,
    displayValue: string,
    fieldDef?: FieldDefinition
  ): string | null => {
    const data = relationData[fieldKey];
    if (!data || !data.options) return null;

    const lowerValue = displayValue.toLowerCase().trim();

    if (fieldDef?.displayFieldType === "date") {
      try {
        const dateObj = new Date(displayValue);
        if (!isNaN(dateObj.getTime())) {
          const isoDate = dateObj.toISOString().split("T")[0].toLowerCase();
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();

          const mmddyyyy = `${month}/${day}/${year}`.toLowerCase();

          const exactMatchIso = data.options.find(
            (option) => option.displayValue.toLowerCase() === isoDate
          );
          if (exactMatchIso) return exactMatchIso.id;

          const exactMatchMmDdYyyy = data.options.find(
            (option) => option.displayValue.toLowerCase() === mmddyyyy
          );
          if (exactMatchMmDdYyyy) return exactMatchMmDdYyyy.id;
        }
      } catch (e) {
        console.error(`Error parsing date for lookup: ${e}`);
      }
    }

    const openParenIndex = lowerValue.lastIndexOf("(");
    if (openParenIndex > 0 && lowerValue.endsWith(")")) {
      const primaryValue = lowerValue.substring(0, openParenIndex).trim();
      const secondaryValue = lowerValue
        .substring(openParenIndex + 1, lowerValue.length - 1)
        .trim();

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

    const exactMatch = data.options.find(
      (option) =>
        option.displayValue.toLowerCase() === lowerValue ||
        option.label.toLowerCase() === lowerValue
    );

    if (exactMatch) return exactMatch.id;

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

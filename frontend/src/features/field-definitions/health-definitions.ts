import { FieldDefinitionsDataset } from "@/types/types";

export const HEALTH_FILES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "health_files",
  name: "Health Files",
  description: "Health document storage and management",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date associated with the health files",
    },
    {
      key: "files",
      type: "file-multiple",
      displayName: "Files",
      description: "Health documents (lab results, scans, reports, etc.)",
    },
  ],
};
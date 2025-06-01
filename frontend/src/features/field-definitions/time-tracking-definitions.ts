import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const TIME_ENTRIES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "time_entries",
  name: "Time Entries",
  description: "Track time spent on various activities",
  fields: [
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Description of the activity",
      isSearchable: true,
    },
    {
      key: "start_time",
      type: "date",
      displayName: "Start Time",
      description: "When the activity started",
      isSearchable: true,
    },
    {
      key: "end_time",
      type: "date",
      displayName: "End Time",
      description: "When the activity ended",
      isSearchable: true,
    },
    {
      key: "duration_minutes",
      type: "number",
      displayName: "Duration (minutes)",
      description: "Duration of the activity in minutes",
      isSearchable: false,
    },
    createRelationField(
      "category_id",
      "Category",
      DATASET_REFERENCES.TIME_CATEGORIES,
      {
        description: "Category of the activity",
        deleteBehavior: "preventDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        isSearchable: false,
        isOptional: true,
      }
    ),
    {
      key: "tags",
      type: "text",
      displayName: "Tags",
      description: "Comma-separated tags for the activity",
      isSearchable: true,
      isOptional: true,
    },
  ],
};

export const TIME_CATEGORIES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "time_categories",
  name: "Time Categories",
  description: "Categories for time tracking activities",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the category",
      isSearchable: true,
    },
    {
      key: "color",
      type: "text",
      displayName: "Color",
      description: "Color hex code for the category",
      isSearchable: false,
      isOptional: true,
    },
  ],
};

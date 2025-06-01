import {
  BloodworkTest,
  BloodMarker,
  BloodResult,
} from "@/store/bloodwork-definitions";
import { DEXAScan } from "@/store/dexa-definitions";
import {
  Experiment,
  Metric,
  DailyLog,
  MetricCategory,
  ExperimentMetric,
} from "@/store/experiment-definitions";
import {
  GratitudeJournalEntry,
  CreativityJournalEntry,
  QuestionJournalEntry,
  Affirmation,
} from "@/store/journaling-definitions";
import {
  Person,
  Meeting,
  PersonAttribute,
  PersonNote,
  BirthdayReminder,
  PersonRelationship,
} from "@/store/people-crm-definitions";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Todo } from "@/store/todo-definitions";

export type DatasetId =
  | "bloodwork"
  | "blood_markers"
  | "blood_results"
  | "dexa"
  | "experiments"
  | "metrics"
  | "daily_logs"
  | "metric_categories"
  | "experiment_metrics"
  | "gratitude_journal"
  | "creativity_journal"
  | "question_journal"
  | "affirmation"
  | "people"
  | "meetings"
  | "person_attributes"
  | "person_notes"
  | "birthday_reminders"
  | "person_relationships"
  | "time_entries"
  | "time_categories"
  | "todos";

export const DATASET_REFERENCES = {
  BLOODWORK: { dataset: "bloodwork" as DatasetId, field: "id" },
  BLOOD_MARKERS: { dataset: "blood_markers" as DatasetId, field: "id" },
  BLOOD_RESULTS: { dataset: "blood_results" as DatasetId, field: "id" },
  DEXA: { dataset: "dexa" as DatasetId, field: "id" },
  EXPERIMENTS: { dataset: "experiments" as DatasetId, field: "id" },
  METRICS: { dataset: "metrics" as DatasetId, field: "id" },
  DAILY_LOGS: { dataset: "daily_logs" as DatasetId, field: "id" },
  METRIC_CATEGORIES: { dataset: "metric_categories" as DatasetId, field: "id" },
  EXPERIMENT_METRICS: {
    dataset: "experiment_metrics" as DatasetId,
    field: "id",
  },
  GRATITUDE_JOURNAL: { dataset: "gratitude_journal" as DatasetId, field: "id" },
  CREATIVITY_JOURNAL: {
    dataset: "creativity_journal" as DatasetId,
    field: "id",
  },
  QUESTION_JOURNAL: { dataset: "question_journal" as DatasetId, field: "id" },
  AFFIRMATION: { dataset: "affirmation" as DatasetId, field: "id" },
  PEOPLE: { dataset: "people" as DatasetId, field: "id" },
  MEETINGS: { dataset: "meetings" as DatasetId, field: "id" },
  PERSON_ATTRIBUTES: { dataset: "person_attributes" as DatasetId, field: "id" },
  PERSON_NOTES: { dataset: "person_notes" as DatasetId, field: "id" },
  BIRTHDAY_REMINDERS: {
    dataset: "birthday_reminders" as DatasetId,
    field: "id",
  },
  PERSON_RELATIONSHIPS: {
    dataset: "person_relationships" as DatasetId,
    field: "id",
  },
  TIME_ENTRIES: { dataset: "time_entries" as DatasetId, field: "id" },
  TIME_CATEGORIES: { dataset: "time_categories" as DatasetId, field: "id" },
  TODOS: { dataset: "todos" as DatasetId, field: "id" },
} as const;

export type DatasetTypeMap = {
  bloodwork: BloodworkTest;
  blood_markers: BloodMarker;
  blood_results: BloodResult;
  dexa: DEXAScan;
  experiments: Experiment;
  metrics: Metric;
  daily_logs: DailyLog;
  metric_categories: MetricCategory;
  experiment_metrics: ExperimentMetric;
  gratitude_journal: GratitudeJournalEntry;
  creativity_journal: CreativityJournalEntry;
  question_journal: QuestionJournalEntry;
  affirmation: Affirmation;
  people: Person;
  meetings: Meeting;
  person_attributes: PersonAttribute;
  person_notes: PersonNote;
  birthday_reminders: BirthdayReminder;
  person_relationships: PersonRelationship;
  time_entries: TimeEntry;
  time_categories: TimeCategory;
  todos: Todo;
};

export interface DatasetSummary {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  lastUpdated: string | null;
}

export type SimpleFieldType =
  | "text"
  | "number"
  | "date"
  | "select-single"
  | "select-multiple"
  | "boolean";

export type FieldType =
  | SimpleFieldType
  | "percentage"
  | "markdown"
  | "tags"
  | "json"
  | "file"
  | "file-multiple";

export type RelationshipDeleteBehavior =
  | "preventDeleteIfReferenced"
  | "cascadeDeleteIfReferenced";

export interface DatasetReference {
  dataset: DatasetId;
  field: string;
  deleteBehavior?: RelationshipDeleteBehavior;
}

export const createRelationField = (
  key: string,
  displayName: string,
  reference: { dataset: DatasetId; field: string },
  options: {
    description?: string;
    deleteBehavior?: RelationshipDeleteBehavior;
    isSearchable?: boolean;
    isOptional?: boolean;
    displayField?: string;
    displayFieldType?: FieldType;
    secondaryDisplayField?: string;
    secondaryDisplayFieldType?: FieldType;
  } = {}
): Pick<
  FieldDefinition,
  | "key"
  | "type"
  | "displayName"
  | "description"
  | "isSearchable"
  | "isOptional"
  | "isRelation"
  | "relatedDataset"
  | "relatedField"
  | "displayField"
  | "displayFieldType"
  | "secondaryDisplayField"
  | "secondaryDisplayFieldType"
  | "preventDeleteIfReferenced"
  | "cascadeDeleteIfReferenced"
> => ({
  key,
  type: "text",
  displayName,
  description: options.description,
  isSearchable: options.isSearchable ?? true,
  ...(options.isOptional && { isOptional: options.isOptional }),
  isRelation: true,
  relatedDataset: reference.dataset,
  relatedField: reference.field,
  ...(options.displayField && { displayField: options.displayField }),
  ...(options.displayFieldType && {
    displayFieldType: options.displayFieldType,
  }),
  ...(options.secondaryDisplayField && {
    secondaryDisplayField: options.secondaryDisplayField,
  }),
  ...(options.secondaryDisplayFieldType && {
    secondaryDisplayFieldType: options.secondaryDisplayFieldType,
  }),
  ...(options.deleteBehavior === "preventDeleteIfReferenced" && {
    preventDeleteIfReferenced: true,
  }),
  ...(options.deleteBehavior === "cascadeDeleteIfReferenced" && {
    cascadeDeleteIfReferenced: true,
  }),
});

export interface SelectOption {
  id: string;
  label: string;
}

export interface ColumnMeta {
  type: FieldType;
  unit?: string;
  description?: string;
  isSearchable?: boolean;

  isRelation?: boolean;
  relatedDataset?: string;
  displayField?: string;
  secondaryDisplayField?: string;
}

export interface FieldDefinition {
  key: string;
  type: FieldType;
  displayName: string;
  description?: string;
  unit?: string;
  isSearchable?: boolean;
  isOptional?: boolean;
  isUnique?: boolean;

  isRelation?: boolean;
  relatedDataset?: DatasetId;
  relatedField?: string;
  displayField?: string;
  displayFieldType?: FieldType;
  secondaryDisplayField?: string;
  secondaryDisplayFieldType?: FieldType;
  preventDeleteIfReferenced?: boolean;
  cascadeDeleteIfReferenced?: boolean;

  options?: SelectOption[];
  acceptedFileTypes?: string; // e.g. "image/*,application/pdf"
}

export type DatasetType = "dexa" | "bloodwork";

export interface FieldDefinitionsState {
  datasets: {
    [key: string]: FieldDefinitionsDataset;
  };
}

export type FieldDefinitionsDataset = {
  id: DatasetId;
  name: string;
  description?: string;
  fields: FieldDefinition[];
};

export interface FieldOption {
  value: string;
  label: string;
}

export interface DynamicField {
  id: string;
  name: string;
  type: SimpleFieldType;
  required: boolean;
  options?: FieldOption[];
  placeholder?: string;
  description?: string;
}

export interface DynamicFieldValue {
  fieldId: string;
  value: string | number | boolean | string[] | null;
}

export interface FileItem {
  id: string;
  src: string;
  name: string;
  type?: string;
  order: number;
}

export interface SingleFileItem {
  id: string;
  src: string;
  name: string;
  type?: string;
}

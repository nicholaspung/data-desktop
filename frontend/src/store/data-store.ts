// src/store/data-store.ts

import { Store } from "@tanstack/react-store";
import { DEXAScan } from "./dexa-definitions";
import {
  BloodMarker,
  BloodResult,
  BloodworkTest,
} from "./bloodwork-definitions";
import {
  DailyLog,
  Experiment,
  ExperimentMetric,
  Metric,
  MetricCategory,
} from "./experiment-definitions";
import {
  Affirmation,
  CreativityJournalEntry,
  GratitudeJournalEntry,
  QuestionJournalEntry,
} from "./journaling-definitions";
import { TimeCategory, TimeEntry } from "./time-tracking-definitions";
import { fieldDefinitionsStore } from "@/features/field-definitions/field-definitions-store";
import { Todo } from "./todo-definitions";
import {
  Person,
  Meeting,
  PersonAttribute,
  PersonNote,
  PersonChat,
  BirthdayReminder,
  PersonRelationship,
} from "./people-crm-definitions";

// Define the types for the data store
export type DataStoreName =
  | "dexa"
  | "bloodwork"
  | "blood_markers"
  | "blood_results"
  | "experiments"
  | "metrics"
  | "daily_logs"
  | "metric_categories"
  | "experiment_metrics"
  | "gratitude_journal"
  | "question_journal"
  | "creativity_journal"
  | "affirmation"
  | "time_entries"
  | "time_categories"
  | "todos"
  | "people"
  | "meetings"
  | "person_attributes"
  | "person_notes"
  | "person_chats"
  | "birthday_reminders"
  | "person_relationships";

type DataStoreType = {
  dexa: DEXAScan[];
  bloodwork: BloodworkTest[];
  blood_markers: BloodMarker[];
  blood_results: BloodResult[];
  experiments: Experiment[];
  metrics: Metric[];
  daily_logs: DailyLog[];
  metric_categories: MetricCategory[];
  experiment_metrics: ExperimentMetric[];
  gratitude_journal: GratitudeJournalEntry[];
  question_journal: QuestionJournalEntry[];
  creativity_journal: CreativityJournalEntry[];
  affirmation: Affirmation[];
  time_entries: TimeEntry[];
  time_categories: TimeCategory[];
  todos: Todo[];
  people: Person[];
  meetings: Meeting[];
  person_attributes: PersonAttribute[];
  person_notes: PersonNote[];
  person_chats: PersonChat[];
  birthday_reminders: BirthdayReminder[];
  person_relationships: PersonRelationship[];
};

// Initial state for the data store
const initialState: DataStoreType = {
  dexa: [],
  bloodwork: [],
  blood_markers: [],
  blood_results: [],
  experiments: [],
  metrics: [],
  daily_logs: [],
  metric_categories: [],
  experiment_metrics: [],
  gratitude_journal: [],
  question_journal: [],
  creativity_journal: [],
  affirmation: [],
  time_entries: [],
  time_categories: [],
  todos: [],
  people: [],
  meetings: [],
  person_attributes: [],
  person_notes: [],
  person_chats: [],
  birthday_reminders: [],
  person_relationships: [],
};

// Create the data store
const dataStore = new Store<DataStoreType>(initialState);

// Helper function to load state into the store
export function loadState(
  data: Record<string, any>[],
  datasetId: DataStoreName
) {
  dataStore.setState((state) => ({
    ...state,
    [datasetId]: data,
  }));
}

// Helper function to process a single entry based on field definitions
function processEntry(entry: Record<string, any>, datasetId: DataStoreName) {
  const fields = fieldDefinitionsStore.state.datasets[datasetId]?.fields || [];

  const processed = { ...entry };

  // Convert dates
  fields.forEach((field) => {
    if (field.type === "date" && processed[field.key]) {
      processed[field.key] = new Date(processed[field.key]);
    }
  });

  return processed;
}

// Helper function to add a new entry to the store
export function addEntry(entry: Record<string, any>, datasetId: DataStoreName) {
  const processedEntry = processEntry(entry, datasetId);

  dataStore.setState((state) => ({
    ...state,
    [datasetId]: [...state[datasetId], processedEntry],
  }));
}

// Helper function to update an entry in the store
export function updateEntry(id: string, entry: any, datasetId: DataStoreName) {
  const processedEntry = processEntry(entry, datasetId);

  dataStore.setState((state) => ({
    ...state,
    [datasetId]: state[datasetId].map((item: any) =>
      item.id === id ? { ...item, ...processedEntry } : item
    ),
  }));
}

// Helper function to delete an entry from the store
export function deleteEntry(id: string, datasetId: DataStoreName) {
  dataStore.setState((state) => ({
    ...state,
    [datasetId]: state[datasetId].filter((item: any) => item.id !== id),
  }));
}

// Export the store
export default dataStore;

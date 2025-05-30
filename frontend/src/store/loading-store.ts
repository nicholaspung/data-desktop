// src/store/loading-store.ts
// Updated with experiment-related and People CRM loading states

import { Store } from "@tanstack/react-store";
import { DataStoreName } from "./data-store";

// Initial state for the loading store
const initialState = {
  dexa: false,
  bloodwork: false,
  blood_markers: false,
  blood_results: false,
  experiments: false,
  metrics: false,
  daily_logs: false,
  metric_categories: false,
  experiment_metrics: false,
  gratitude_journal: false,
  question_journal: false,
  creativity_journal: false,
  affirmation: false,
  time_entries: false,
  time_categories: false,
  todos: false,
  people: false,
  meetings: false,
  person_attributes: false,
  person_notes: false,
  birthday_reminders: false,
  person_relationships: false,
};

// Create the loading store
const loadingStore = new Store(initialState);

// Helper function to set loading state
export function setLoadingState(datasetId: DataStoreName, loading: boolean) {
  loadingStore.setState((state) => ({
    ...state,
    [datasetId]: loading,
  }));
}

// Export the store
export default loadingStore;

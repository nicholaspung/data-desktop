// src/store/settings-store.ts
import { Store } from "@tanstack/react-store";

interface SettingsState {
  visibleRoutes: Record<string, boolean>;
  defaultDatasetView: string;
  enabledDatasets: Record<string, boolean>;
  setVisibleRoute: (route: string, visible: boolean) => void;
  setDefaultDatasetView: (view: string) => void;
  setEnabledDataset: (dataset: string, enabled: boolean) => void;
}

// Define the initial visible routes
const defaultRoutes = {
  "/": true,
  "/dexa": true,
  "/bloodwork": true,
  "/calendar": true,
  "/experiments": true,
  "/metric": true,
  "/time-tracker": true,
  "/journaling": true,
  "/metric-calendar": true,
  "/time-planner": true,
  "/dataset": true,
  "/settings": true,
  "/todos": true,
};

// Define initial enabled datasets
const defaultDatasets = {
  dexa: true,
  bloodwork: true,
  blood_markers: true,
  blood_results: true,
  experiments: true,
  metrics: true,
  daily_logs: true,
  metric_categories: true,
  experiment_metrics: true,
  gratitude_journal: true,
  question_journal: true,
  creativity_journal: true,
  affirmation: true,
  time_entries: true,
  time_categories: true,
  todos: true,
};

// Initialize settings from localStorage or defaults
const getInitialState = (): Partial<SettingsState> => {
  try {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }

  return {
    visibleRoutes: defaultRoutes,
    defaultDatasetView: "card",
    enabledDatasets: defaultDatasets,
  };
};

const initialState: SettingsState = {
  ...getInitialState(),
  setVisibleRoute: (route: string, visible: boolean) => {
    settingsStore.setState((state) => {
      const newState = {
        ...state,
        visibleRoutes: {
          ...state.visibleRoutes,
          [route]: visible,
        },
      };
      saveSettings(newState);
      return newState;
    });
  },
  setDefaultDatasetView: (view: string) => {
    settingsStore.setState((state) => {
      const newState = {
        ...state,
        defaultDatasetView: view,
      };
      saveSettings(newState);
      return newState;
    });
  },
  setEnabledDataset: (dataset: string, enabled: boolean) => {
    settingsStore.setState((state) => {
      const newState = {
        ...state,
        enabledDatasets: {
          ...state.enabledDatasets,
          [dataset]: enabled,
        },
      };
      saveSettings(newState);
      return newState;
    });
  },
} as SettingsState;

// Helper function to save settings to localStorage
const saveSettings = (state: SettingsState) => {
  try {
    localStorage.setItem(
      "app-settings",
      JSON.stringify({
        visibleRoutes: state.visibleRoutes,
        defaultDatasetView: state.defaultDatasetView,
        enabledDatasets: state.enabledDatasets,
      })
    );
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

// Create the settings store
const settingsStore = new Store<SettingsState>(initialState);

export default settingsStore;

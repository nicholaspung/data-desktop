import { Store } from "@tanstack/react-store";

interface DashboardSummaryConfig {
  id: string;
  size: 'small' | 'medium' | 'large';
  order: number;
  visible: boolean;
}

const defaultDashboardSummaries = {
  "/calendar": { id: "/calendar", size: 'medium' as const, order: 0, visible: true },
  "/todos": { id: "/todos", size: 'medium' as const, order: 1, visible: true },
  "/time-tracker": { id: "/time-tracker", size: 'medium' as const, order: 2, visible: true },
  "/experiments": { id: "/experiments", size: 'medium' as const, order: 3, visible: true },
  "/metric": { id: "/metric", size: 'medium' as const, order: 4, visible: true },
  "/journaling": { id: "/journaling", size: 'medium' as const, order: 5, visible: true },
  "/people-crm": { id: "/people-crm", size: 'medium' as const, order: 6, visible: true },
  "/dexa": { id: "/dexa", size: 'medium' as const, order: 7, visible: true },
  "/bloodwork": { id: "/bloodwork", size: 'medium' as const, order: 8, visible: true },
};

interface SettingsState {
  visibleRoutes: Record<string, boolean>;
  defaultDatasetView: string;
  enabledDatasets: Record<string, boolean>;
  dashboardSummaryConfigs: Record<string, DashboardSummaryConfig>;
  setVisibleRoute: (route: string, visible: boolean) => void;
  setDefaultDatasetView: (view: string) => void;
  setEnabledDataset: (dataset: string, enabled: boolean) => void;
  setDashboardSummaryConfig: (id: string, config: Partial<DashboardSummaryConfig>) => void;
  reorderDashboardSummaries: (sourceIndex: number, destinationIndex: number) => void;
}

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
  "/people": true,
  "/people-crm": true,
  "/body-measurements": true,
};

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
  time_planner_configs: true,
  todos: true,
  people: true,
  meetings: true,
  person_attributes: true,
  person_notes: true,
  person_chats: true,
  birthday_reminders: true,
  person_relationships: true,
  body_measurements: true,
};

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
    dashboardSummaryConfigs: defaultDashboardSummaries,
  };
};

const initialState: SettingsState = {
  visibleRoutes: defaultRoutes,
  defaultDatasetView: "card",
  enabledDatasets: defaultDatasets,
  dashboardSummaryConfigs: defaultDashboardSummaries,
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
  setDashboardSummaryConfig: (id: string, config: Partial<DashboardSummaryConfig>) => {
    settingsStore.setState((state) => {
      const currentConfig = state.dashboardSummaryConfigs[id] || {
        id,
        size: 'medium',
        order: Object.keys(state.dashboardSummaryConfigs).length,
        visible: true,
      };
      
      const newState = {
        ...state,
        dashboardSummaryConfigs: {
          ...state.dashboardSummaryConfigs,
          [id]: { ...currentConfig, ...config },
        },
      };
      saveSettings(newState);
      return newState;
    });
  },
  reorderDashboardSummaries: (sourceIndex: number, destinationIndex: number) => {
    settingsStore.setState((state) => {
      const configs = Object.values(state.dashboardSummaryConfigs);
      configs.sort((a, b) => a.order - b.order);
      
      const [removed] = configs.splice(sourceIndex, 1);
      configs.splice(destinationIndex, 0, removed);
      
      const reorderedConfigs: Record<string, DashboardSummaryConfig> = {};
      configs.forEach((config, index) => {
        reorderedConfigs[config.id] = { ...config, order: index };
      });
      
      const newState = {
        ...state,
        dashboardSummaryConfigs: reorderedConfigs,
      };
      saveSettings(newState);
      return newState;
    });
  },
} as SettingsState;

const saveSettings = (state: SettingsState) => {
  try {
    localStorage.setItem(
      "app-settings",
      JSON.stringify({
        visibleRoutes: state.visibleRoutes,
        defaultDatasetView: state.defaultDatasetView,
        enabledDatasets: state.enabledDatasets,
        dashboardSummaryConfigs: state.dashboardSummaryConfigs,
      })
    );
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

const settingsStore = new Store<SettingsState>(initialState);

export default settingsStore;
export type { DashboardSummaryConfig };

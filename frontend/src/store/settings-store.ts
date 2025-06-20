import { Store } from "@tanstack/react-store";
import { dashboardRegistry } from "@/lib/dashboard-registry";

interface DashboardSummaryConfig {
  id: string;
  size: "small" | "medium" | "large";
  height: "small" | "medium" | "large";
  order: number;
  visible: boolean;
}

const getDefaultDashboardSummaries = () => {
  return dashboardRegistry.getDefaultConfigs();
};

interface RouteConfig {
  href: string;
  order: number;
  visible: boolean;
}

interface SettingsState {
  visibleRoutes: Record<string, boolean>;
  routeConfigs: Record<string, RouteConfig>;
  defaultDatasetView: string;
  enabledDatasets: Record<string, boolean>;
  dashboardSummaryConfigs: Record<string, DashboardSummaryConfig>;
  setVisibleRoute: (route: string, visible: boolean) => void;
  setDefaultDatasetView: (view: string) => void;
  setEnabledDataset: (dataset: string, enabled: boolean) => void;
  setDashboardSummaryConfig: (
    id: string,
    config: Partial<DashboardSummaryConfig>
  ) => void;
  reorderDashboardSummaries: (
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  reorderRoutes: (sourceIndex: number, destinationIndex: number) => void;
}

const getDefaultRoutes = () => {
  const routes: Record<string, boolean> = {
    "/": true,
    "/metric-calendar": true,
    "/time-planner": true,
    "/dataset": true,
    "/settings": true,
    "/people": true,
  };
  
  dashboardRegistry.getAllRoutes().forEach(route => {
    routes[route] = true;
  });
  
  return routes;
};

const defaultRouteConfigs: Record<string, RouteConfig> = {
  "/": { href: "/", order: 0, visible: true },
  "/time-tracker": { href: "/time-tracker", order: 1, visible: true },
  "/calendar": { href: "/calendar", order: 2, visible: true },
  "/todos": { href: "/todos", order: 3, visible: true },
  "/metric": { href: "/metric", order: 4, visible: true },
  "/metric-calendar": { href: "/metric-calendar", order: 5, visible: true },
  "/experiments": { href: "/experiments", order: 6, visible: true },
  "/journaling": { href: "/journaling", order: 7, visible: true },
  "/time-planner": { href: "/time-planner", order: 8, visible: true },
  "/people-crm": { href: "/people-crm", order: 9, visible: true },
  "/body-measurements": {
    href: "/body-measurements",
    order: 10,
    visible: true,
  },
  "/wealth": { href: "/wealth", order: 11, visible: true },
  "/dexa": { href: "/dexa", order: 12, visible: true },
  "/bloodwork": { href: "/bloodwork", order: 13, visible: true },
  "/dataset": { href: "/dataset", order: 14, visible: true },
  "/settings": { href: "/settings", order: 15, visible: true },
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
  financial_logs: true,
  financial_balances: true,
  paycheck_info: true,
  financial_files: true,
};

export const getRouteDatasetMapping = (): Record<string, string[]> => {
  const baseMapping: Record<string, string[]> = {
    "/people": ["people", "person_attributes"],
  };
  
  const registryMapping = dashboardRegistry.getRouteDatasetMapping();
  
  return { ...baseMapping, ...registryMapping };
};

export const routeDatasetMapping = getRouteDatasetMapping();

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
    visibleRoutes: getDefaultRoutes(),
    routeConfigs: defaultRouteConfigs,
    defaultDatasetView: "card",
    enabledDatasets: defaultDatasets,
    dashboardSummaryConfigs: getDefaultDashboardSummaries(),
  };
};

const initialState: SettingsState = {
  visibleRoutes: getDefaultRoutes(),
  routeConfigs: defaultRouteConfigs,
  defaultDatasetView: "card",
  enabledDatasets: defaultDatasets,
  dashboardSummaryConfigs: getDefaultDashboardSummaries(),
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
  setDashboardSummaryConfig: (
    id: string,
    config: Partial<DashboardSummaryConfig>
  ) => {
    settingsStore.setState((state) => {
      const currentConfig = state.dashboardSummaryConfigs[id] || {
        id,
        size: "small",
        height: "large",
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
  reorderDashboardSummaries: (
    sourceIndex: number,
    destinationIndex: number
  ) => {
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
  reorderRoutes: (sourceIndex: number, destinationIndex: number) => {
    settingsStore.setState((state) => {
      const configs = Object.values(state.routeConfigs);
      configs.sort((a, b) => a.order - b.order);

      const [removed] = configs.splice(sourceIndex, 1);
      configs.splice(destinationIndex, 0, removed);

      const reorderedConfigs: Record<string, RouteConfig> = {};
      configs.forEach((config, index) => {
        reorderedConfigs[config.href] = { ...config, order: index };
      });

      const newState = {
        ...state,
        routeConfigs: reorderedConfigs,
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
        routeConfigs: state.routeConfigs,
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
export type { DashboardSummaryConfig, RouteConfig };

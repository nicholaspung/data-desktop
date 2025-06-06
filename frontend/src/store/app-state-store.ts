import { Store } from "@tanstack/react-store";

type AppStateStore = {
  dashboardDataLoaded: boolean;
  setDashboardDataLoaded: (loaded: boolean) => void;
};

const appStateStore = new Store<AppStateStore>({
  dashboardDataLoaded: false,
  setDashboardDataLoaded: (loaded: boolean) => {
    appStateStore.setState((state) => ({
      ...state,
      dashboardDataLoaded: loaded,
    }));
  },
});

export default appStateStore;

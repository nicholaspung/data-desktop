import { Store } from "@tanstack/react-store";

const loadingStore = new Store({
  dexa: false,
  bloodwork: false,
  blood_markers: false,
  blood_results: false,
});

export const setLoadingState = (isLoading: boolean, datasetId: string) => {
  loadingStore.setState((state) => {
    return {
      ...state,
      [datasetId]: isLoading,
    };
  });
};

export default loadingStore;

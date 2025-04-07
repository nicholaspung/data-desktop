import { Store } from "@tanstack/react-store";
import { DataStoreName } from "./data-store";

const loadingStore = new Store({
  dexa: false,
  bloodwork: false,
  blood_markers: false,
  blood_results: false,
});

export const setLoadingState = (
  isLoading: boolean,
  datasetId: DataStoreName
) => {
  loadingStore.setState((state) => {
    return {
      ...state,
      [datasetId]: isLoading,
    };
  });
};

export default loadingStore;

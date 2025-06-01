import { Store } from "@tanstack/react-store";
import { DATASET_IDS } from "@/features/field-definitions/field-definitions-store";
import { DataStoreName } from "./data-store";

const initialState: Record<DataStoreName, boolean> = DATASET_IDS.reduce(
  (acc, id) => {
    acc[id] = false;
    return acc;
  },
  {} as Record<DataStoreName, boolean>
);

const loadingStore = new Store(initialState);

export function setLoadingState(datasetId: DataStoreName, loading: boolean) {
  loadingStore.setState((state) => ({
    ...state,
    [datasetId]: loading,
  }));
}

export default loadingStore;

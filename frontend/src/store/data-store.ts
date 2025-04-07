import { Store } from "@tanstack/react-store";

export type DataStoreName =
  | "dexa"
  | "bloodwork"
  | "blood_markers"
  | "blood_results";

const dataStore = new Store({
  dexa: [] as any[],
  bloodwork: [] as any[],
  blood_markers: [] as any[],
  blood_results: [] as any[],
});

export const loadState = (data: any, datasetId: DataStoreName) => {
  dataStore.setState((state) => {
    return {
      ...state,
      [datasetId]: data,
    };
  });
};

export const updateEntry = (
  id: string,
  data: any,
  datasetId: DataStoreName
) => {
  dataStore.setState((state) => {
    const datasetData = state[datasetId];

    const index = datasetData.findIndex((el) => el.id === id);
    datasetData[index] = data;

    return {
      ...state,
      [datasetId]: datasetData,
    };
  });
};

export const deleteEntry = (id: string, datasetId: DataStoreName) => {
  dataStore.setState((state) => {
    const datasetData = state[datasetId];

    const index = datasetData.findIndex((el) => el.id === id);
    datasetData.splice(index, 1);

    return {
      ...state,
      [datasetId]: datasetData,
    };
  });
};

export const addEntry = (data: any, datasetId: DataStoreName) => {
  dataStore.setState((state) => {
    const datasetData = state[datasetId];

    datasetData.push(data);

    return {
      ...state,
      [datasetId]: datasetData,
    };
  });
};

export default dataStore;

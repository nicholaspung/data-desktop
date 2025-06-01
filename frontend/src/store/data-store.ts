import {
  fieldDefinitionsStore,
  DATASET_IDS,
} from "@/features/field-definitions/field-definitions-store";
import { Store } from "@tanstack/react-store";
import { DatasetTypeMap } from "@/types/types";

export type DataStoreName = (typeof DATASET_IDS)[number];

type DataStoreType = {
  [K in keyof DatasetTypeMap]: DatasetTypeMap[K][];
};

const initialState = DATASET_IDS.reduce((acc, id) => {
  acc[id as keyof DataStoreType] = [];
  return acc;
}, {} as DataStoreType);

const dataStore = new Store<DataStoreType>(initialState);

export function loadState(data: Record<string, any>[], datasetId: string) {
  dataStore.setState((state) => ({
    ...state,
    [datasetId]: data,
  }));
}

function processEntry(entry: Record<string, any>, datasetId: DataStoreName) {
  const fields = fieldDefinitionsStore.state.datasets[datasetId]?.fields || [];

  const processed = { ...entry };

  fields.forEach((field) => {
    if (field.type === "date" && processed[field.key]) {
      processed[field.key] = new Date(processed[field.key]);
    }
  });

  return processed;
}

export function addEntry(entry: Record<string, any>, datasetId: DataStoreName) {
  const processedEntry = processEntry(entry, datasetId);

  dataStore.setState((state) => ({
    ...state,
    [datasetId]: [...(state[datasetId] || []), processedEntry],
  }));
}

export function updateEntry(id: string, entry: any, datasetId: DataStoreName) {
  const processedEntry = processEntry(entry, datasetId);

  dataStore.setState((state) => ({
    ...state,
    [datasetId]: (state[datasetId] || []).map((item: any) =>
      item.id === id ? { ...item, ...processedEntry } : item
    ),
  }));
}

export function canDeleteEntry(
  id: string,
  datasetId: DataStoreName
): { canDelete: boolean; reason?: string } {
  const allDatasets = fieldDefinitionsStore.state.datasets;

  for (const [otherDatasetId, dataset] of Object.entries(allDatasets)) {
    for (const field of dataset.fields) {
      if (
        field.isRelation &&
        field.relatedDataset === datasetId &&
        field.preventDeleteIfReferenced
      ) {
        const referencingRecords = (
          dataStore.state[otherDatasetId as DataStoreName] || []
        ).filter((item: any) => item[field.key] === id);

        if (referencingRecords.length > 0) {
          return {
            canDelete: false,
            reason: `Cannot delete this record because it is referenced by ${referencingRecords.length} record(s) in ${dataset.name}`,
          };
        }
      }
    }
  }

  return { canDelete: true };
}

export function deleteEntry(
  id: string,
  datasetId: DataStoreName
): { success: boolean; error?: string } {
  const deleteCheck = canDeleteEntry(id, datasetId);
  if (!deleteCheck.canDelete) {
    return { success: false, error: deleteCheck.reason };
  }

  dataStore.setState((state) => ({
    ...state,
    [datasetId]: (state[datasetId] || []).filter((item: any) => item.id !== id),
  }));

  cascadeDeleteRelatedRecords(id, datasetId);

  return { success: true };
}

function cascadeDeleteRelatedRecords(
  deletedId: string,
  deletedDatasetId: DataStoreName
) {
  const allDatasets = fieldDefinitionsStore.state.datasets;
  const relatedFields: Array<{ datasetId: string; fieldKey: string }> = [];

  Object.entries(allDatasets).forEach(([datasetId, dataset]) => {
    dataset.fields.forEach((field) => {
      if (
        field.isRelation &&
        field.relatedDataset === deletedDatasetId &&
        field.cascadeDeleteIfReferenced
      ) {
        relatedFields.push({ datasetId, fieldKey: field.key });
      }
    });
  });

  if (relatedFields.length === 0) {
    return;
  }

  const recordsToDelete: Array<{ id: string; datasetId: string }> = [];

  relatedFields.forEach(({ datasetId, fieldKey }) => {
    const currentRecords = dataStore.state[datasetId as DataStoreName] || [];
    const matchingRecords = currentRecords.filter(
      (item: any) => item[fieldKey] === deletedId
    );

    matchingRecords.forEach((record: any) => {
      recordsToDelete.push({ id: record.id, datasetId });
    });
  });

  dataStore.setState((state) => {
    const newState = { ...state };

    relatedFields.forEach(({ datasetId, fieldKey }) => {
      if (newState[datasetId as DataStoreName]) {
        (newState as any)[datasetId] = (
          (newState as any)[datasetId] || []
        ).filter((item: any) => item[fieldKey] !== deletedId);
      }
    });

    return newState;
  });

  recordsToDelete.forEach(({ id, datasetId }) => {
    cascadeDeleteRelatedRecords(id, datasetId as DataStoreName);
  });
}

export default dataStore;

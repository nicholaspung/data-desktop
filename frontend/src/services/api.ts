import { DatasetType, FieldDefinition } from "@/types";
import {
  AddRecord,
  CreateDataset,
  DeleteDataset,
  DeleteRecord,
  GetDataset,
  GetDatasets,
  GetRecord,
  GetRecords,
  ImportRecords,
  UpdateDataset,
  UpdateRecord,
} from "../../wailsjs/go/backend/App";
import { database } from "wailsjs/go/models";

// API Service with methods to call the backend
export const ApiService = {
  // Dataset methods
  async getDatasets(): Promise<database.Dataset[]> {
    try {
      const datasets = await GetDatasets();
      return datasets;
    } catch (error) {
      console.error("Failed to get datasets:", error);
      throw error;
    }
  },

  async getDataset(id: string): Promise<database.Dataset> {
    try {
      const dataset = await GetDataset(id);
      return dataset;
    } catch (error) {
      console.error(`Failed to get dataset ${id}:`, error);
      throw error;
    }
  },

  async createDataset(
    name: string,
    description: string,
    type: DatasetType,
    fields: FieldDefinition[]
  ): Promise<database.Dataset> {
    try {
      const fieldsJson = JSON.stringify(fields);
      const dataset = await CreateDataset(name, description, type, fieldsJson);
      return dataset;
    } catch (error) {
      console.error("Failed to create dataset:", error);
      throw error;
    }
  },

  async updateDataset(
    id: string,
    name: string,
    description: string,
    fields: FieldDefinition[]
  ): Promise<database.Dataset> {
    try {
      const fieldsJson = JSON.stringify(fields);
      const dataset = await UpdateDataset(id, name, description, fieldsJson);
      return dataset;
    } catch (error) {
      console.error(`Failed to update dataset ${id}:`, error);
      throw error;
    }
  },

  async deleteDataset(id: string): Promise<void> {
    try {
      await DeleteDataset(id);
    } catch (error) {
      console.error(`Failed to delete dataset ${id}:`, error);
      throw error;
    }
  },

  // Record methods
  async getRecords<T = Record<string, any>>(datasetId: string): Promise<T[]> {
    try {
      const records = await GetRecords(datasetId);
      return records as T[];
    } catch (error) {
      console.error(`Failed to get records for dataset ${datasetId}:`, error);
      throw error;
    }
  },

  async getRecord<T = Record<string, any>>(id: string): Promise<T> {
    try {
      const record = await GetRecord(id);
      return record as T;
    } catch (error) {
      console.error(`Failed to get record ${id}:`, error);
      throw error;
    }
  },

  async addRecord<T = Record<string, any>>(
    datasetId: string,
    data: Record<string, any>
  ): Promise<T> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await AddRecord(datasetId, dataJson);
      return record as T;
    } catch (error) {
      console.error(`Failed to add record to dataset ${datasetId}:`, error);
      throw error;
    }
  },

  async updateRecord<T = Record<string, any>>(
    id: string,
    data: Record<string, any>
  ): Promise<T> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await UpdateRecord(id, dataJson);
      return record as T;
    } catch (error) {
      console.error(`Failed to update record ${id}:`, error);
      throw error;
    }
  },

  async deleteRecord(id: string): Promise<void> {
    try {
      await DeleteRecord(id);
    } catch (error) {
      console.error(`Failed to delete record ${id}:`, error);
      throw error;
    }
  },

  async importRecords(
    datasetId: string,
    records: Record<string, any>[]
  ): Promise<number> {
    try {
      const recordsJson = JSON.stringify(records);
      const count = await ImportRecords(datasetId, recordsJson);
      return count;
    } catch (error) {
      console.error(`Failed to import records to dataset ${datasetId}:`, error);
      throw error;
    }
  },
};

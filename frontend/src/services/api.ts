// src/services/api.ts - Updated with GetRecordsWithRelations method
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
  GetRecordsWithRelations, // Add this new import
  ImportRecords,
  UpdateDataset,
  UpdateRecord,
} from "../../wailsjs/go/backend/App";
import { database } from "wailsjs/go/models";
import { toast } from "sonner";

// API Service with methods to call the backend
export const ApiService = {
  // Dataset methods
  async getDatasets(): Promise<database.Dataset[]> {
    try {
      const datasets = await GetDatasets();
      // Return empty array instead of null if no datasets found
      return datasets || [];
    } catch (error) {
      console.error("Failed to get datasets:", error);
      // Show a toast notification to the user
      toast.error("Failed to load datasets. Please restart the application.");
      // Return empty array to prevent null reference errors
      return [];
    }
  },

  async getDataset(id: string): Promise<database.Dataset | null> {
    try {
      const dataset = await GetDataset(id);
      return dataset;
    } catch (error) {
      console.error(`Failed to get dataset ${id}:`, error);
      toast.error(`Failed to load dataset "${id}"`);
      return null;
    }
  },

  async createDataset(
    name: string,
    description: string,
    type: DatasetType,
    fields: FieldDefinition[]
  ): Promise<database.Dataset | null> {
    try {
      const fieldsJson = JSON.stringify(fields);
      const dataset = await CreateDataset(name, description, type, fieldsJson);
      return dataset;
    } catch (error) {
      console.error("Failed to create dataset:", error);
      toast.error("Failed to create dataset");
      return null;
    }
  },

  async updateDataset(
    id: string,
    name: string,
    description: string,
    fields: FieldDefinition[]
  ): Promise<database.Dataset | null> {
    try {
      const fieldsJson = JSON.stringify(fields);
      const dataset = await UpdateDataset(id, name, description, fieldsJson);
      return dataset;
    } catch (error) {
      console.error(`Failed to update dataset ${id}:`, error);
      toast.error("Failed to update dataset");
      return null;
    }
  },

  async deleteDataset(id: string): Promise<boolean> {
    try {
      await DeleteDataset(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete dataset ${id}:`, error);
      toast.error("Failed to delete dataset");
      return false;
    }
  },

  // Record methods
  async getRecords<T = Record<string, any>>(datasetId: string): Promise<T[]> {
    try {
      const records = await GetRecords(datasetId);
      return (records as T[]) || [];
    } catch (error) {
      console.error(`Failed to get records for dataset ${datasetId}:`, error);
      toast.error("Failed to load records");
      // Return empty array to prevent null reference errors
      return [] as T[];
    }
  },

  // New method to get records with relations included
  async getRecordsWithRelations<T = Record<string, any>>(
    datasetId: string
  ): Promise<T[]> {
    try {
      const records = await GetRecordsWithRelations(datasetId);
      return (records as T[]) || [];
    } catch (error) {
      console.error(
        `Failed to get records with relations for dataset ${datasetId}:`,
        error
      );
      toast.error("Failed to load records with related data");
      // Return empty array to prevent null reference errors
      return [] as T[];
    }
  },

  async getRecord<T = Record<string, any>>(id: string): Promise<T | null> {
    try {
      const record = await GetRecord(id);
      return record as T;
    } catch (error) {
      console.error(`Failed to get record ${id}:`, error);
      toast.error("Failed to load record");
      return null;
    }
  },

  async addRecord<T = Record<string, any>>(
    datasetId: string,
    data: Record<string, any>
  ): Promise<T | null> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await AddRecord(datasetId, dataJson);
      return record as T;
    } catch (error) {
      console.error(`Failed to add record to dataset ${datasetId}:`, error);
      toast.error("Failed to add record");
      return null;
    }
  },

  async updateRecord<T = Record<string, any>>(
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await UpdateRecord(id, dataJson);
      return record as T;
    } catch (error) {
      console.error(`Failed to update record ${id}:`, error);
      toast.error("Failed to update record");
      return null;
    }
  },

  async deleteRecord(id: string): Promise<boolean> {
    try {
      await DeleteRecord(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete record ${id}:`, error);
      toast.error("Failed to delete record");
      return false;
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
      toast.error("Failed to import records");
      return 0;
    }
  },
};

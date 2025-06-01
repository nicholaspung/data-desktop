import { DatasetType, FieldDefinition } from "@/types/types";
import {
  AddRecord,
  CreateDataset,
  DeleteDataset,
  DeleteRecord,
  GetDataset,
  GetDatasets,
  GetRecord,
  GetRecords,
  GetRecordsWithRelations,
  ImportRecords,
  UpdateDataset,
  UpdateRecord,
  UploadFileChunk,
  UploadFile,
  GetFileAsBase64,
  DeleteFile,
} from "../../wailsjs/go/backend/App";
import { database } from "wailsjs/go/models";
import { toast } from "sonner";

export const ApiService = {
  async getDatasets(): Promise<database.Dataset[]> {
    try {
      const datasets = await GetDatasets();

      return datasets || [];
    } catch (error) {
      console.error("Failed to get datasets:", error);

      toast.error("Failed to load datasets. Please restart the application.");

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
    } catch (error: any) {
      console.error(`Failed to delete dataset ${id}:`, error);

      const errorMessage = error.toString();
      if (errorMessage.includes("referenced by other records")) {
        toast.error(
          "Cannot delete this dataset because it contains records used by other records"
        );
      } else {
        toast.error("Failed to delete dataset");
      }

      return false;
    }
  },

  async getRecords<T = Record<string, any>>(
    datasetId: string,
    fetchImages: boolean = true
  ): Promise<T[]> {
    try {
      const records = await GetRecords(datasetId, fetchImages);
      return (records as T[]) || [];
    } catch (error) {
      console.error(`Failed to get records for dataset ${datasetId}:`, error);
      toast.error("Failed to load records");
      return [] as T[];
    }
  },

  async getRecordsWithRelations<T = Record<string, any>>(
    datasetId: string,
    fetchImages: boolean = true
  ): Promise<T[]> {
    try {
      const records = await GetRecordsWithRelations(datasetId, fetchImages);
      return (records as T[]) || [];
    } catch (error) {
      console.error(
        `Failed to get records with relations for dataset ${datasetId}:`,
        error
      );
      toast.error("Failed to load records with related data");
      return [] as T[];
    }
  },

  async getRecord<T = Record<string, any>>(
    id: string,
    fetchRelatedData: boolean = false,
    fetchImages: boolean = true
  ): Promise<T | null> {
    try {
      const record = await GetRecord(id, fetchRelatedData, fetchImages);
      return record as T;
    } catch (error) {
      console.error(`Failed to get record ${id}:`, error);
      toast.error("Failed to load record");
      return null;
    }
  },

  async addRecord<T = Record<string, any>>(
    datasetId: string,
    data: Record<string, any>,
    fetchImages: boolean = true
  ): Promise<T | null> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await AddRecord(datasetId, dataJson, fetchImages);
      return record as T;
    } catch (error) {
      console.error(`Failed to add record to dataset ${datasetId}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("must be unique")) {
        throw error;
      }

      toast.error("Failed to add record");
      return null;
    }
  },

  async updateRecord<T = Record<string, any>>(
    id: string,
    data: Record<string, any>,
    fetchRelatedData: boolean = true,
    fetchImages: boolean = true
  ): Promise<T | null> {
    try {
      const dataJson = JSON.stringify(data);
      const record = await UpdateRecord(
        id,
        dataJson,
        fetchRelatedData,
        fetchImages
      );
      return record as T;
    } catch (error) {
      console.error(`Failed to update record ${id}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("must be unique")) {
        throw error;
      }

      toast.error("Failed to update record");
      return null;
    }
  },

  async deleteRecord(id: string): Promise<boolean> {
    try {
      await DeleteRecord(id);
      return true;
    } catch (error: any) {
      console.error(`Failed to delete record ${id}:`, error);

      const errorMessage = error.toString();
      if (errorMessage.includes("referenced by other records")) {
        toast.error(
          "Cannot delete this record because it is used by other records"
        );
      } else {
        toast.error("Failed to delete record");
      }

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

  async uploadFile(
    base64File: string,
    prefix: string,
    fileName: string
  ): Promise<string | null> {
    try {
      const result = await UploadFile(base64File, prefix, fileName);
      return result;
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Failed to upload file");
      return null;
    }
  },

  async getFile(filePath: string): Promise<string | null> {
    try {
      if (!filePath) return null;
      const base64File = await GetFileAsBase64(filePath);
      return base64File;
    } catch (error) {
      console.error(`Failed to get file at path ${filePath}:`, error);
      toast.error("Failed to load file");
      return null;
    }
  },

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await DeleteFile(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file at path ${filePath}:`, error);
      toast.error("Failed to delete file");
      return false;
    }
  },

  async downloadFile(filePath: string, fileName: string): Promise<void> {
    try {
      const fileData = await this.getFile(filePath);
      if (!fileData) {
        toast.error("File not found");
        return;
      }

      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Failed to download file at path ${filePath}:`, error);
      toast.error("Failed to download file");
    }
  },

  async uploadFileChunk(
    chunkData: string,
    fileName: string,
    chunkIndex: number,
    totalChunks: number,
    sessionId: string
  ): Promise<string | null> {
    try {
      const result = await UploadFileChunk(
        chunkData,
        fileName,
        chunkIndex,
        totalChunks,
        sessionId
      );
      return result;
    } catch (error) {
      console.error("Failed to upload file chunk:", error);
      toast.error("Failed to upload file chunk");
      return null;
    }
  },
};

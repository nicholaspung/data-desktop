// src/services/enhanced-api.ts
import { ApiService as BaseApiService } from "./api";
import { FieldDefinition } from "@/types/types";

// Enhanced API service with methods for batch processing
export const EnhancedApiService = {
  ...BaseApiService, // Inherit all methods from the base API service

  /**
   * Import records in batches with progress tracking
   *
   * @param datasetId The ID of the dataset to import into
   * @param records Array of records to import
   * @param options Configuration options for import
   * @returns Statistics about the import operation
   */
  async batchImportRecords(
    datasetId: string,
    records: Record<string, any>[],
    options?: {
      chunkSize?: number;
      onProgress?: (progress: {
        processed: number;
        total: number;
        succeeded: number;
        failed: number;
        errors: string[];
      }) => void;
    }
  ): Promise<{
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const chunkSize = options?.chunkSize || 100;
    const total = records.length;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Process in chunks
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);

        try {
          // Import the chunk
          const importedCount = await BaseApiService.importRecords(
            datasetId,
            chunk
          );
          succeeded += importedCount;
        } catch (error) {
          console.error(`Error importing chunk ${i / chunkSize + 1}:`, error);
          failed += chunk.length;
          errors.push(
            `Chunk ${i / chunkSize + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        processed += chunk.length;

        // Report progress
        if (options?.onProgress) {
          options.onProgress({
            total,
            processed,
            succeeded,
            failed,
            errors,
          });
        }

        // Small delay to avoid UI freezing
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return { succeeded, failed, errors };
    } catch (error) {
      console.error("Batch import operation failed:", error);
      throw error;
    }
  },

  /**
   * Validate a dataset exists before trying to import
   *
   * @param datasetId The dataset ID to validate
   * @returns True if the dataset exists
   */
  async validateDatasetExists(datasetId: string): Promise<boolean> {
    try {
      const dataset = await BaseApiService.getDataset(datasetId);
      return !!dataset;
    } catch (error) {
      console.error(`Dataset validation failed for ${datasetId}:`, error);
      return false;
    }
  },

  /**
   * Pre-process records based on field definitions before import
   *
   * @param records Raw records to process
   * @param fields Field definitions to use for type conversion
   * @returns Processed records ready for import
   */
  preprocessRecords(
    records: Record<string, any>[],
    fields: FieldDefinition[]
  ): Record<string, any>[] {
    return records.map((record) => {
      const processed: Record<string, any> = {};

      fields.forEach((field) => {
        const value = record[field.key];

        // Skip undefined values
        if (value === undefined) return;

        // Process based on field type
        switch (field.type) {
          case "number":
          case "percentage":
            processed[field.key] =
              typeof value === "number" ? value : parseFloat(value) || 0;
            break;

          case "boolean":
            if (typeof value === "string") {
              processed[field.key] =
                value.toLowerCase() === "true" ||
                value.toLowerCase() === "yes" ||
                value === "1";
            } else {
              processed[field.key] = Boolean(value);
            }
            break;

          case "date":
            if (value) {
              processed[field.key] =
                value instanceof Date ? value : new Date(value);
            }
            break;

          case "text":
          default:
            processed[field.key] = value !== null ? String(value) : "";
        }
      });

      return processed;
    });
  },
};

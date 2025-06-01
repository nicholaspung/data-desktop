import { useState } from "react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface ChunkedUploadOptions {
  chunkSize?: number; // in bytes
  onProgress?: (progress: number) => void;
}

interface ChunkedUploadResult {
  loading: boolean;
  error: string | null;
  uploadFile: (
    file: File,
    prefix?: string,
    options?: ChunkedUploadOptions
  ) => Promise<string | null>;
}

export default function useChunkedFileUpload(): ChunkedUploadResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    prefix = "file",
    options?: ChunkedUploadOptions
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    const chunkSize = options?.chunkSize || 1024 * 1024; // 1MB default
    const totalChunks = Math.ceil(file.size / chunkSize);
    const sessionId = uuidv4();

    try {
      if (file.size < chunkSize) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        const result = await ApiService.uploadFile(
          base64Data,
          prefix,
          file.name
        );

        if (!result) {
          throw new Error("Failed to upload file");
        }

        return result;
      }

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(chunk);
        });

        const base64Data = await base64Promise;

        const result = await ApiService.uploadFileChunk(
          base64Data,
          file.name,
          i,
          totalChunks,
          sessionId
        );

        if (options?.onProgress) {
          options.onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }

        if (i === totalChunks - 1 && result) {
          return result;
        }
      }

      throw new Error("Failed to complete chunked upload");
    } catch (err: any) {
      setError(err.message);
      toast.error(`File upload failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadFile,
  };
}

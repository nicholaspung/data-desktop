import { useState } from "react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";

interface FileUploadResult {
  loading: boolean;
  error: string | null;
  uploadFile: (file: File, prefix?: string) => Promise<string | null>;
  uploadFiles: (files: File[], prefix?: string) => Promise<string[]>;
}

export default function useFileUpload(): FileUploadResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFile = async (
    file: File,
    prefix = "file"
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const result = await ApiService.uploadFile(base64Data, prefix, file.name);

      if (!result) {
        throw new Error("Failed to upload file");
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      toast.error(`File upload failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (
    files: File[],
    prefix = "file"
  ): Promise<string[]> => {
    setLoading(true);
    setError(null);

    const results: string[] = [];

    try {
      for (const file of files) {
        const result = await uploadFile(file, `${prefix}-${results.length}`);
        if (result) {
          results.push(result);
        }
      }

      return results;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Multiple file upload failed: ${err.message}`);
      return results;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadFile,
    uploadFiles,
  };
}

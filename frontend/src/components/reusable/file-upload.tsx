import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, FileIcon, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import useChunkedFileUpload from "@/hooks/useChunkedFileUpload";
import { ApiService } from "@/services/api";
import { SingleFileItem } from "@/types/types";

interface FileUploadProps {
  value: SingleFileItem | null;
  onChange: (value: SingleFileItem | null) => void;
  className?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string; // e.g., "application/pdf,text/plain"
  showPreview?: boolean;
  disabled?: boolean;
}

export default function FileUpload({
  value,
  onChange,
  className,
  maxSize = 100,
  acceptedTypes,
  showPreview = true,
  disabled = false,
}: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useChunkedFileUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSize}MB limit`);
      }

      setCurrentFile(file.name);
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split(".").pop() || "";
      const generatedFileName = `${fileId}${fileExtension ? `.${fileExtension}` : ""}`;
      let fileSrc: string;

      // For large files (> 5MB), use chunked upload
      if (file.size > 5 * 1024 * 1024) {
        const filePath = await uploadFile(file, generatedFileName, {
          chunkSize: 2 * 1024 * 1024, // 2MB chunks
          onProgress: (progress) => {
            setUploadProgress(Math.round(progress));
          },
        });

        if (filePath) {
          fileSrc = `file://${filePath}`;
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      } else {
        fileSrc = await fileToBase64(file);
        setUploadProgress(100);
      }

      const fileItem: SingleFileItem = {
        id: fileId,
        src: fileSrc,
        name: generatedFileName,
        type: file.type,
      };

      onChange(fileItem);
    } catch (err: any) {
      setError(err.message);
      console.error("File upload error:", err);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setCurrentFile("");
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveFile = () => {
    if (disabled) return;

    if (value && value.src.startsWith("file://")) {
      const filePath = value.src.substring(7);
      ApiService.deleteFile(filePath).catch((err) => {
        console.error("Failed to delete file from server:", err);
      });
    }

    onChange(null);
  };

  const getFileTypeIcon = (fileItem: SingleFileItem | null) => {
    if (!fileItem || !fileItem.type)
      return <FileIcon className="h-12 w-12 text-muted-foreground" />;

    if (
      fileItem.type.startsWith("image/") &&
      !fileItem.src.startsWith("file://")
    ) {
      return (
        <img
          src={fileItem.src}
          alt="File preview"
          className="max-h-32 max-w-full object-contain"
        />
      );
    }

    return <FileIcon className="h-12 w-12 text-primary" />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative border rounded-md p-2 sm:p-4 bg-muted/20">
          <div className="flex items-center gap-2 sm:gap-4">
            {showPreview && (
              <div className="flex-shrink-0">{getFileTypeIcon(value)}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm truncate">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {value.type || "File"}
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                onClick={handleRemoveFile}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() =>
            !isLoading && !disabled && fileInputRef.current?.click()
          }
          className={cn(
            "flex flex-col items-center justify-center p-3 sm:p-6 border-2 border-dashed rounded-md transition-colors min-h-[100px] sm:min-h-[120px]",
            isLoading || disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-muted/50",
            error && "border-destructive"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={handleFileSelect}
            disabled={isLoading || disabled}
          />

          {isLoading ? (
            <div className="flex flex-col items-center w-full space-y-2 sm:space-y-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Uploading {currentFile ? `"${currentFile}"` : "file"}...
              </p>
              <Progress value={uploadProgress} className="w-full h-1 sm:h-2" />
              <p className="text-xs text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-1 sm:mb-2" />
              <p className="font-medium text-xs sm:text-sm mb-1 text-center">Click to upload file</p>
              <p className="text-xs text-muted-foreground text-center px-2">
                {acceptedTypes
                  ? `Accepted formats: ${acceptedTypes.split(",").join(", ")}`
                  : "All file types accepted"}
                {maxSize && ` (max ${maxSize}MB)`}
              </p>
              {error && (
                <p className="text-xs text-destructive mt-2 text-center">{error}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

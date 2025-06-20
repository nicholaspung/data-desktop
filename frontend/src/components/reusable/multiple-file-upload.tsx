import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Plus,
  FileIcon,
  Download,
  ArrowUp,
  ArrowDown,
  FileAudio,
  FileVideo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import useChunkedFileUpload from "@/hooks/useChunkedFileUpload";
import { Progress } from "@/components/ui/progress";

export interface FileItem {
  id: string;
  src: string;
  name: string;
  type?: string;
  order: number;
}

interface MultipleFileUploadProps {
  value: FileItem[];
  onChange: (value: FileItem[]) => void;
  className?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  acceptedTypes?: string; // e.g., "application/pdf,text/plain,audio/*,video/*"
  enableReordering?: boolean;
  disabled?: boolean;
}

export default function MultipleFileUpload({
  value = [],
  onChange,
  className,
  maxSize = 100,
  maxFiles = 10,
  acceptedTypes,
  enableReordering = true,
  disabled = false,
}: MultipleFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useChunkedFileUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (value.length + files.length > maxFiles) {
        throw new Error(`Maximum of ${maxFiles} files allowed`);
      }

      const newFiles: FileItem[] = [...value];
      let totalFiles = files.length;
      let processedFiles = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);

        if (file.size > maxSize * 1024 * 1024) {
          console.warn(
            `File ${file.name} exceeds ${maxSize}MB limit and will be skipped`
          );
          totalFiles--;
          continue;
        }

        let fileSrc: string;
        const fileId = crypto.randomUUID();
        const fileExtension = file.name.split(".").pop() || "";
        const generatedFileName = `${fileId}${fileExtension ? `.${fileExtension}` : ""}`;

        // For large files (> 5MB), use chunked upload
        if (file.size > 5 * 1024 * 1024) {
          const filePath = await uploadFile(file, generatedFileName, {
            chunkSize: 2 * 1024 * 1024, // 2MB chunks
            onProgress: (progress) => {
              const fileProgress = progress / 100;
              const overallProgress =
                ((processedFiles + fileProgress) / totalFiles) * 100;
              setUploadProgress(Math.round(overallProgress));
            },
          });

          if (filePath) {
            fileSrc = `file://${filePath}`;
          } else {
            throw new Error(`Failed to upload ${file.name}`);
          }
        } else {
          fileSrc = await fileToBase64(file);

          processedFiles++;
          setUploadProgress(Math.round((processedFiles / totalFiles) * 100));
        }

        newFiles.push({
          id: fileId,
          src: fileSrc,
          name: generatedFileName,
          type: file.type,
          order: value.length + i,
        });
      }

      onChange(newFiles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
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

  const handleRemoveFile = (id: string) => {
    if (disabled) return;
    const fileToRemove = value.find((file) => file.id === id);

    if (fileToRemove && fileToRemove.src.startsWith("file://")) {
      const filePath = fileToRemove.src.substring(7);
      ApiService.deleteFile(filePath).catch((err) => {
        console.error("Failed to delete file from server:", err);
      });
    }

    const newFiles = value.filter((file) => file.id !== id);

    newFiles.forEach((file, index) => {
      file.order = index;
    });
    onChange(newFiles);
  };

  const moveFile = (id: string, direction: "up" | "down") => {
    if (disabled) return;
    const sortedFiles = [...value].sort((a, b) => a.order - b.order);
    const index = sortedFiles.findIndex((file) => file.id === id);

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sortedFiles.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newFiles = [...sortedFiles];

    const temp = newFiles[index].order;
    newFiles[index].order = newFiles[targetIndex].order;
    newFiles[targetIndex].order = temp;

    onChange(newFiles.sort((a, b) => a.order - b.order));
  };

  const handleDownload = (file: FileItem) => {
    if (disabled) return;
    if (file.src.startsWith("file://")) {
      const filePath = file.src.substring(7);
      ApiService.downloadFile(filePath, file.name);
    } else {
      const link = document.createElement("a");
      link.href = file.src;
      link.download = file.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const FileImageDisplay = ({ file }: { file: FileItem }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        if (file.src.startsWith("file://") || file.src.startsWith("files/")) {
          setLoading(true);
          try {
            const filePath = file.src.startsWith("file://")
              ? file.src.substring(7)
              : file.src;
            const base64Data = await ApiService.getFile(filePath);
            setImageUrl(base64Data);
          } catch (error) {
            console.error("Failed to load image:", error);
            setImageUrl(null);
          } finally {
            setLoading(false);
          }
        } else {
          setImageUrl(file.src);
        }
      };

      loadImage();
    }, [file.src]);

    if (loading) {
      return (
        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    return (
      <img
        src={imageUrl || ""}
        alt={file.name}
        className="h-12 w-12 object-cover bg-muted rounded"
      />
    );
  };

  const getFileTypeIcon = (file: FileItem) => {
    if (
      file.src.startsWith("data:image/") ||
      (file.type && file.type.startsWith("image/")) ||
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
    ) {
      return <FileImageDisplay file={file} />;
    } else if (file.type?.startsWith("audio/")) {
      return <FileAudio className="h-12 w-12 text-primary" />;
    } else if (file.type?.startsWith("video/")) {
      return <FileVideo className="h-12 w-12 text-primary" />;
    }
    return <FileIcon className="h-12 w-12 text-primary" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
        {value
          .sort((a, b) => a.order - b.order)
          .map((file) => (
            <div
              key={file.id}
              className="relative border rounded-md p-2 lg:p-4 bg-muted/20"
            >
              <div className="flex items-start gap-2 md:gap-4">
                <div className="flex-shrink-0">{getFileTypeIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs md:text-sm break-words">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.type || "File"}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col md:flex-row gap-0.5 md:gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-8 md:w-8"
                    onClick={() => handleDownload(file)}
                    disabled={disabled}
                  >
                    <Download className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 md:h-8 md:w-8"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {enableReordering && !disabled && (
                <div className="flex flex-col md:flex-row justify-center gap-1 md:gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 md:h-8 md:px-3 text-xs"
                    onClick={() => moveFile(file.id, "up")}
                    disabled={file.order === 0}
                  >
                    <ArrowUp className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Move Up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 md:h-8 md:px-3 text-xs"
                    onClick={() => moveFile(file.id, "down")}
                    disabled={file.order === value.length - 1}
                  >
                    <ArrowDown className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Move Down</span>
                  </Button>
                </div>
              )}
            </div>
          ))}

        {value.length < maxFiles && !disabled && (
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center p-3 lg:p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px] md:min-h-[120px]",
              isLoading ? "cursor-wait" : "cursor-pointer",
              error && "border-destructive"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isLoading || disabled}
            />

            {isLoading ? (
              <div className="flex flex-col items-center w-full space-y-2 md:space-y-4">
                <Progress
                  value={uploadProgress}
                  className="w-full h-1 md:h-2"
                />
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  Uploading {currentFile ? `"${currentFile}"` : "files"}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadProgress}% complete
                </p>
              </div>
            ) : (
              <>
                <Plus className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground mb-1 md:mb-2" />
                <p className="font-medium text-xs md:text-sm mb-1 text-center">
                  Add Files
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {value.length}/{maxFiles} used
                </p>
                {error && (
                  <p className="text-xs text-destructive mt-2 text-center">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

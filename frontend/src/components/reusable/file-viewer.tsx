import { useCallback, useEffect, useState } from "react";
import {
  FileIcon,
  Download,
  FileAudio,
  FileVideo,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ApiService } from "@/services/api";

interface FileViewerProps {
  src: string;
  fileName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "preview";
  showDownloadButton?: boolean;
}

export default function FileViewer({
  src,
  fileName = "File",
  className,
  size = "md",
  showDownloadButton = false,
}: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      if (src.startsWith("file://") || src.startsWith("files/")) {
        setLoading(true);
        try {
          const filePath = src.startsWith("file://") ? src.substring(7) : src;
          const base64Data = await ApiService.getFile(filePath);

          setFileUrl(base64Data);
        } catch (error) {
          console.error("Failed to load file:", error);
          setFileUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setFileUrl(src);
      }
    };

    loadFile();
  }, [src]);

  const handleDownload = useCallback(() => {
    const isFilePath = src.startsWith("file://") || src.startsWith("files/");
    const displayUrl = src.startsWith("file://") ? src.substring(7) : src;

    if (isFilePath) {
      ApiService.downloadFile(displayUrl, fileName || "download");
    } else if (src.startsWith("data:")) {
      try {
        const byteCharacters = atob(src.split(",")[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading data URL:", error);

        const link = document.createElement("a");
        link.href = src;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const link = document.createElement("a");
      link.href = src;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [src, fileName]);

  if (!src) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-md w-10 h-10">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-md w-10 h-10">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    preview: "w-full h-auto max-h-[calc(90vh-8rem)]",
  };

  const displaySrc = fileUrl || src;

  const isFilePath = src.startsWith("file://") || src.startsWith("files/");

  const fileType = (() => {
    if (
      displaySrc.startsWith("data:image/") ||
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(src)
    ) {
      return "image";
    }
    if (
      displaySrc.startsWith("data:audio/") ||
      /\.(mp3|wav|ogg|m4a|aac)$/i.test(src)
    ) {
      return "audio";
    }
    if (
      displaySrc.startsWith("data:video/") ||
      /\.(mp4|webm|ogv|avi|mov)$/i.test(src)
    ) {
      return "video";
    }
    if (/\.(pdf)$/i.test(src)) {
      return "pdf";
    }
    if (/\.(doc|docx|txt|rtf)$/i.test(src)) {
      return "document";
    }
    if (/\.(xls|xlsx|csv)$/i.test(src)) {
      return "spreadsheet";
    }
    return "file";
  })();

  const isImage = fileType === "image";
  const isAudio = fileType === "audio";
  const isVideo = fileType === "video";
  const isPdf = fileType === "pdf";
  const isDocument = fileType === "document";

  const getFileIcon = () => {
    if (isImage && displaySrc)
      return (
        <img
          src={displaySrc}
          alt={fileName}
          className="w-full h-full object-cover"
        />
      );
    if (isAudio) return <FileAudio className="h-5 w-5 text-primary" />;
    if (isVideo) return <FileVideo className="h-5 w-5 text-primary" />;
    return <FileIcon className="h-5 w-5 text-primary" />;
  };

  const getFileTypeIcon = () => {
    switch (fileType) {
      case "image":
        return displaySrc ? (
          <img
            src={displaySrc}
            alt={fileName}
            className="max-h-32 max-w-32 object-contain"
          />
        ) : (
          <FileIcon className="h-16 w-16 text-primary" />
        );
      case "audio":
        return <FileAudio className="h-16 w-16 text-primary" />;
      case "video":
        return <FileVideo className="h-16 w-16 text-primary" />;
      case "document":
        return <FileText className="h-16 w-16 text-primary" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-16 w-16 text-primary" />;
      default:
        return <FileIcon className="h-16 w-16 text-primary" />;
    }
  };

  if (size === "preview") {
    return (
      <div className={cn("w-full", className)}>
        {showDownloadButton && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto min-h-0">
          {isImage && displaySrc ? (
            <div className="flex items-center justify-center">
              <img
                src={displaySrc}
                alt={fileName}
                className="max-w-full max-h-[calc(90vh-8rem)] object-contain"
              />
            </div>
          ) : isFilePath && !isImage ? (
            <div className="flex flex-col items-center justify-center py-8">
              {getFileTypeIcon()}
              <p className="text-center mb-4 mt-4">
                File is too large for preview
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ) : isAudio && displaySrc ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-full max-w-md">
                <div className="mb-4 flex items-center justify-center">
                  <FileAudio className="h-16 w-16 text-primary" />
                </div>
                <audio controls className="w-full">
                  <source src={displaySrc} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          ) : isVideo && displaySrc ? (
            <div className="flex items-center justify-center p-8">
              <video
                controls
                className="max-w-full max-h-[calc(90vh-8rem)] object-contain"
              >
                <source src={displaySrc} />
                Your browser does not support the video element.
              </video>
            </div>
          ) : isPdf && displaySrc ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="w-full h-full">
                <iframe
                  src={displaySrc}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              </div>
            </div>
          ) : isDocument ? (
            <div className="flex flex-col items-center justify-center py-8">
              {getFileTypeIcon()}
              <p className="text-center mb-4 mt-4">
                Document preview not available
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              {getFileTypeIcon()}
              <p className="text-center mb-4 mt-4">
                File preview not available
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-muted rounded-md overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {getFileIcon()}
    </div>
  );
}

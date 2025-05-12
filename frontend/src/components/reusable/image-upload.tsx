import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  aspectRatio?: string;
  maxSize?: number; // in MB
}

export default function ImageUpload({
  value,
  onChange,
  className,
  aspectRatio = "1/1",
  maxSize = 20,
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSize}MB limit`);
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const base64 = await fileToBase64(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onChange(base64);
        setIsLoading(false);
        setUploadProgress(0);
      }, 300);
    } catch (err: any) {
      setError(err.message);
      console.error("Image upload error:", err);
      setIsLoading(false);
      setUploadProgress(0);
    } finally {
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

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative">
          <div
            className={cn(
              "relative bg-muted rounded-md overflow-hidden",
              `aspect-[${aspectRatio}]`
            )}
          >
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors",
            isLoading ? "cursor-wait" : "cursor-pointer hover:bg-muted/50",
            error && "border-destructive",
            `aspect-[${aspectRatio}]`
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center w-full space-y-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="font-medium text-sm mb-1">Click to upload image</p>
              <p className="text-xs text-muted-foreground">
                SVG, PNG, JPG or GIF (max {maxSize}MB)
              </p>
              {error && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

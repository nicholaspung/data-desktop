import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id: string;
  src: string;
  caption?: string;
  order: number;
}

interface MultipleImageUploadProps {
  value: ImageItem[];
  onChange: (value: ImageItem[]) => void;
  className?: string;
  aspectRatio?: string;
  maxSize?: number; // in MB
  maxImages?: number;
  enableCaptions?: boolean;
  enableReordering?: boolean;
}

export default function MultipleImageUpload({
  value = [],
  onChange,
  className,
  aspectRatio = "1/1",
  maxSize = 20,
  maxImages = 10,
  enableCaptions = true,
  enableReordering = true,
}: MultipleImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (value.length + files.length > maxImages) {
        throw new Error(`Maximum of ${maxImages} images allowed`);
      }

      const newImages: ImageItem[] = [...value];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > maxSize * 1024 * 1024) {
          console.warn(
            `File ${file.name} exceeds ${maxSize}MB limit and will be skipped`
          );
          continue;
        }

        if (!file.type.startsWith("image/")) {
          console.warn(`File ${file.name} is not an image and will be skipped`);
          continue;
        }

        const base64 = await fileToBase64(file);

        newImages.push({
          id: crypto.randomUUID(),
          src: base64,
          caption: "",
          order: value.length + i,
        });
      }

      onChange(newImages);
    } catch (err: any) {
      setError(err.message);
      console.error("Image upload error:", err);
    } finally {
      setIsLoading(false);
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

  const handleRemoveImage = (id: string) => {
    const newImages = value.filter((img) => img.id !== id);

    newImages.forEach((img, index) => {
      img.order = index;
    });
    onChange(newImages);
  };

  const handleCaptionChange = (id: string, caption: string) => {
    const newImages = value.map((img) =>
      img.id === id ? { ...img, caption } : img
    );
    onChange(newImages);
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    const sortedImages = [...value].sort((a, b) => a.order - b.order);
    const index = sortedImages.findIndex((img) => img.id === id);

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sortedImages.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newImages = [...sortedImages];

    const temp = newImages[index].order;
    newImages[index].order = newImages[targetIndex].order;
    newImages[targetIndex].order = temp;

    onChange(newImages.sort((a, b) => a.order - b.order));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Existing Images */}
        {value
          .sort((a, b) => a.order - b.order)
          .map((image) => (
            <div key={image.id} className="relative">
              <div
                className={cn(
                  "relative bg-muted rounded-md overflow-hidden",
                  `aspect-[${aspectRatio}]`
                )}
              >
                <img
                  src={image.src}
                  alt="Uploaded image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {enableReordering && (
                  <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shadow-md opacity-80"
                      onClick={() => moveImage(image.id, "up")}
                      disabled={image.order === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shadow-md opacity-80"
                      onClick={() => moveImage(image.id, "down")}
                      disabled={image.order === value.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {enableCaptions && (
                <input
                  type="text"
                  value={image.caption || ""}
                  onChange={(e) =>
                    handleCaptionChange(image.id, e.target.value)
                  }
                  placeholder="Caption (optional)"
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                />
              )}
            </div>
          ))}

        {/* Add Image Button */}
        {value.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
              `aspect-[${aspectRatio}]`,
              error && "border-destructive"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isLoading}
            />

            <Plus className="h-8 w-8 text-muted-foreground mb-2" />

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <p className="font-medium text-sm mb-1 text-center">
                  Add Images
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {value.length}/{maxImages} used
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

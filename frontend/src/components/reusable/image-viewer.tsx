import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  thumbnailSize?: "sm" | "md" | "lg";
}

export default function ImageViewer({
  src,
  alt = "Image",
  className,
  thumbnailSize = "md",
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-md w-10 h-10">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "cursor-pointer bg-muted rounded-md overflow-hidden",
            sizeClasses[thumbnailSize],
            className
          )}
        >
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle>{alt}</DialogTitle>
        <div className="overflow-hidden rounded-md my-2">
          <img
            src={src}
            alt={alt}
            className="w-full object-contain max-h-[70vh]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

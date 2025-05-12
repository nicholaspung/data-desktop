import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export interface ImageItem {
  id: string;
  src: string;
  caption?: string;
  order?: number;
}

interface ImageCarouselProps {
  images: (ImageItem | string)[];
  className?: string;
  aspectRatio?: string;
  showCaptions?: boolean;
  showCounter?: boolean;
  showNavigation?: boolean;
  maxHeight?: string;
  fullHeight?: boolean;
}

export default function ImageCarousel({
  images,
  className,
  aspectRatio,
  showCaptions = true,
  showCounter = true,
  showNavigation = true,
  maxHeight,
  fullHeight = false,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const normalizedImages: ImageItem[] = images.map((img, i) =>
    typeof img === "string" ? { id: `img-${i}`, src: img } : img
  );

  if (normalizedImages[0].order !== undefined) {
    normalizedImages.sort((a, b) =>
      a.order !== undefined && b.order !== undefined ? a.order - b.order : 0
    );
  }

  const next = () => {
    setActiveIndex((prev) =>
      prev === normalizedImages.length - 1 ? 0 : prev + 1
    );
  };

  const prev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? normalizedImages.length - 1 : prev - 1
    );
  };

  const containerStyle: React.CSSProperties = {
    ...(maxHeight ? { maxHeight } : {}),
    height: fullHeight ? "100%" : undefined,
  };

  const imageContainerStyle: React.CSSProperties = {
    position: "relative",
    height: fullHeight ? "100%" : undefined,
    ...(aspectRatio && !fullHeight ? { aspectRatio } : {}),
  };

  return (
    <div
      className={cn("relative", fullHeight && "h-full", className)}
      style={containerStyle}
    >
      {/* Navigation buttons positioned outside the image */}
      {showNavigation && normalizedImages.length > 1 && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full p-1 z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="overflow-hidden rounded-md w-full h-full">
            <div
              className="relative overflow-hidden rounded-md h-full"
              style={imageContainerStyle}
            >
              <img
                src={normalizedImages[activeIndex].src}
                alt={
                  normalizedImages[activeIndex].caption ||
                  `Image ${activeIndex + 1}`
                }
                className={cn(
                  "w-full object-contain",
                  fullHeight ? "h-full" : "object-cover"
                )}
                style={maxHeight ? { maxHeight } : {}}
              />

              {showCaptions && normalizedImages[activeIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm z-10">
                  {normalizedImages[activeIndex].caption}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full p-1 z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* When navigation is disabled, just show the image */}
      {(!showNavigation || normalizedImages.length <= 1) && (
        <div
          className="relative overflow-hidden rounded-md h-full"
          style={imageContainerStyle}
        >
          <img
            src={normalizedImages[activeIndex].src}
            alt={
              normalizedImages[activeIndex].caption ||
              `Image ${activeIndex + 1}`
            }
            className={cn(
              "w-full object-contain",
              fullHeight ? "h-full" : "object-cover"
            )}
            style={maxHeight ? { maxHeight } : {}}
          />

          {showCaptions && normalizedImages[activeIndex].caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm z-10">
              {normalizedImages[activeIndex].caption}
            </div>
          )}
        </div>
      )}

      {showCounter && normalizedImages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
          {normalizedImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 w-2 rounded-full ${
                idx === activeIndex ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

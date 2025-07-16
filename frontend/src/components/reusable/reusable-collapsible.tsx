import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ReusableCollapsibleProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function ReusableCollapsible({
  title,
  description,
  content,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
  headerActions,
  onOpenChange,
}: ReusableCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div 
        className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleToggle}
      >
        <div
          className={cn(
            "flex flex-row items-center justify-between space-y-0",
            isOpen ? "pb-1" : "pb-0",
            headerClassName
          )}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 pointer-events-none"
              >
                {isOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                <span className="sr-only">Toggle content</span>
              </Button>
              <div>
                <div className="font-medium text-sm">{title}</div>
                {description && (
                  <div className="text-xs text-muted-foreground">
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>
          {headerActions && <div onClick={(e) => e.stopPropagation()}>{headerActions}</div>}
        </div>
      </div>
      
      {isOpen && (
        <>
          <div className="border-t" />
          <div className="px-3 pb-2 pt-2">
            <div className={cn("", contentClassName)}>
              {content}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

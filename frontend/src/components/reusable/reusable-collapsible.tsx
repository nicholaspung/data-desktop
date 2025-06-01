import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ReusableCard from "@/components/reusable/reusable-card";

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
    <ReusableCard
      cardClassName={className}
      title={
        <div
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            headerClassName
          )}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleToggle}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle content</span>
              </Button>
              <div>
                <div className="font-medium">{title}</div>
                {description && (
                  <div className="text-sm text-muted-foreground">
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      }
      content={
        isOpen ? (
          <div className={cn("pt-2", contentClassName)}>
            {content}
          </div>
        ) : null
      }
    />
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, GripVertical, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReusableCard from "./reusable-card";
import { DashboardSummaryConfig } from "@/store/settings-store";
import { DatasetSummary } from "@/types/types";

interface CustomizableSummaryCardProps {
  summary: DatasetSummary;
  config: DashboardSummaryConfig;
  isEditMode: boolean;
  onConfigChange: (id: string, config: Partial<DashboardSummaryConfig>) => void;
}

const sizeClasses = {
  small: "col-span-1",
  medium: "col-span-2",
  large: "col-span-3",
};

const sizeLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export default function CustomizableSummaryCard({
  summary,
  config,
  isEditMode,
  onConfigChange,
}: CustomizableSummaryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: summary.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSizeChange = (size: "small" | "medium" | "large") => {
    onConfigChange(summary.id, { size });
  };

  const handleVisibilityToggle = () => {
    onConfigChange(summary.id, { visible: !config.visible });
  };

  const cardContent = (
    <div
      className={`${sizeClasses[config.size]} ${!config.visible ? "opacity-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ReusableCard
        showHeader={false}
        cardClassName={`hover:bg-accent/20 transition-colors relative ${isEditMode ? "ring-2 ring-primary/20" : ""}`}
        contentClassName="pt-6"
        content={
          <div className="flex flex-row justify-between">
            <div className="flex flex-col">
              <div className="flex items-center">
                {summary.icon}
                <span className="ml-2 font-bold">{summary.name}</span>
              </div>
              <span>
                {summary.lastUpdated
                  ? `Last updated: ${new Date(summary.lastUpdated).toLocaleDateString()}`
                  : "No data yet"}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.count}</p>
              <p className="text-sm text-muted-foreground">total records</p>
            </div>
            {isEditMode && (isHovered || true) && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVisibilityToggle}
                  className="h-6 w-6 p-0"
                >
                  {config.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(sizeLabels).map(([size, label]) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() =>
                          handleSizeChange(size as "small" | "medium" | "large")
                        }
                        className={config.size === size ? "bg-accent" : ""}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div
                  className="cursor-grab active:cursor-grabbing"
                  {...listeners}
                  {...attributes}
                >
                  <GripVertical className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>
        }
      />
    </div>
  );

  if (isEditMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${sizeClasses[config.size]} ${isDragging ? "z-10" : ""}`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      to={summary.href === "/dataset" ? "/dataset" : summary.href}
      search={
        summary.href === "/dataset" ? { datasetId: summary.id } : undefined
      }
    >
      {cardContent}
    </Link>
  );
}

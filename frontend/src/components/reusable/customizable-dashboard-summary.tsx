import { ReactNode, Children, cloneElement, isValidElement } from "react";
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
import { DashboardSummaryConfig } from "@/store/settings-store";

interface CustomizableDashboardSummaryProps {
  id: string;
  config: DashboardSummaryConfig;
  isEditMode: boolean;
  onConfigChange: (id: string, config: Partial<DashboardSummaryConfig>) => void;
  children: ReactNode;
}

const sizeClasses = {
  small: "col-span-1",
  medium: "col-span-1 sm:col-span-2 lg:col-span-2",
  large: "col-span-1 sm:col-span-2 lg:col-span-3",
};

const heightClasses = {
  small: "h-48",
  medium: "h-64",
  large: "h-80",
};

const sizeLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const heightLabels = {
  small: "Short",
  medium: "Medium",
  large: "Tall",
};

export default function CustomizableDashboardSummary({
  id,
  config,
  isEditMode,
  onConfigChange,
  children,
}: CustomizableDashboardSummaryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSizeChange = (size: "small" | "medium" | "large") => {
    onConfigChange(id, { size });
  };

  const handleHeightChange = (height: "small" | "medium" | "large") => {
    onConfigChange(id, { height });
  };

  const handleVisibilityToggle = () => {
    onConfigChange(id, { visible: !config.visible });
  };

  const content = (
    <div
      className={`${!config.visible ? "opacity-50" : ""} ${isEditMode ? "border-2 border-dashed border-primary/30 rounded-lg p-2" : ""} ${heightClasses[config.height]} flex flex-col`}
      data-size={config.size}
      data-height={config.height}
      data-id={id}
    >
      {isEditMode && (
        <div className="flex justify-between items-center mb-2 bg-muted/50 rounded px-2 py-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded"
              title="Drag to reorder"
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {sizeLabels[config.size]} × {heightLabels[config.height]}
            </span>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVisibilityToggle}
              className="h-7 w-7 p-0 hover:bg-background"
              title={config.visible ? "Hide" : "Show"}
            >
              {config.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-background"
                  title="Resize"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Width
                </div>
                {Object.entries(sizeLabels).map(([size, label]) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() =>
                      handleSizeChange(size as "small" | "medium" | "large")
                    }
                    className={`${config.size === size ? "bg-accent font-medium" : ""} cursor-pointer`}
                  >
                    <span
                      className={config.size === size ? "font-semibold" : ""}
                    >
                      {label}
                    </span>
                    {config.size === size && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <div className="border-t my-1"></div>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Height
                </div>
                {Object.entries(heightLabels).map(([height, label]) => (
                  <DropdownMenuItem
                    key={height}
                    onClick={() =>
                      handleHeightChange(height as "small" | "medium" | "large")
                    }
                    className={`${config.height === height ? "bg-accent font-medium" : ""} cursor-pointer`}
                  >
                    <span
                      className={
                        config.height === height ? "font-semibold" : ""
                      }
                    >
                      {label}
                    </span>
                    {config.height === height && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      <div
        className={`flex-1 flex flex-col ${heightClasses[config.height]} overflow-y-auto`}
      >
        {Children.map(children, (child) => {
          if (isValidElement(child)) {
            return cloneElement(child, {
              ...(child.props as any),
              isDashboardConstrained: true,
            });
          }
          return child;
        })}
      </div>
    </div>
  );

  if (!config.visible && !isEditMode) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClasses[config.size]} ${heightClasses[config.height]} ${isEditMode ? "ring-2 ring-primary/20 rounded-lg" : ""}`}
    >
      {content}
    </div>
  );
}

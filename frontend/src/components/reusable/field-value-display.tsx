import { FieldDefinition } from "@/types/types";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import ImageViewer from "./image-viewer";

interface FieldValueDisplayProps {
  field: FieldDefinition;
  value: any;
  className?: string;
}

export default function FieldValueDisplay({
  field,
  value,
}: FieldValueDisplayProps) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">—</span>;
  }

  switch (field.type) {
    case "date":
      if (!value)
        return <span className="text-muted-foreground italic">—</span>;
      try {
        const date = typeof value === "string" ? new Date(value) : value;
        return <span>{format(date, "PP")}</span>;
      } catch (e) {
        console.error(e);
        return <span>{String(value)}</span>;
      }

    case "boolean":
      return <span>{value ? "Yes" : "No"}</span>;

    case "number":
      return (
        <span>
          {typeof value === "number" ? value.toLocaleString() : value}
          {field.unit && (
            <span className="ml-1 text-muted-foreground">{field.unit}</span>
          )}
        </span>
      );

    case "percentage":
      return (
        <span>
          {typeof value === "number"
            ? (value < 1 ? value * 100 : value).toFixed(2)
            : value}
          %
        </span>
      );

    case "select-multiple":
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-muted-foreground italic">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );

    case "image":
      if (!value)
        return <span className="text-muted-foreground italic">No image</span>;
      return (
        <ImageViewer src={value} alt={field.displayName} thumbnailSize="lg" />
      );

    case "markdown":
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {value}
        </div>
      );

    case "text":
    default:
      return <span>{String(value)}</span>;
  }
}

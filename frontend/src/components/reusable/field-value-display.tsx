import { FieldDefinition } from "@/types/types";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import FileViewer from "./file-viewer";
import { formatCurrency } from "@/lib/data-utils";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { getDisplayValue } from "@/lib/table-utils";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface FieldValueDisplayProps {
  field: FieldDefinition;
  value: any;
  className?: string;
}

export default function FieldValueDisplay({
  field,
  value,
}: FieldValueDisplayProps) {
  const allData = useStore(dataStore, (state) => state);

  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">—</span>;
  }

  if (field.isRelation && field.relatedDataset && value) {
    const relatedRecords = allData[field.relatedDataset] || [];
    const relatedRecord = relatedRecords.find(
      (record: any) => record.id === value
    );

    if (relatedRecord) {
      const displayValue = getDisplayValue(field, relatedRecord);
      return <span>{displayValue}</span>;
    } else {
      return <span className="text-muted-foreground">{String(value)}</span>;
    }
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
      if (typeof value === "number") {
        if (field.unit === "$") {
          return <span>{formatCurrency(value)}</span>;
        }
        return (
          <span>
            {value.toLocaleString()}
            {field.unit && (
              <span className="ml-1 text-muted-foreground">{field.unit}</span>
            )}
          </span>
        );
      }
      return <span>{value}</span>;

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

    case "markdown":
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-headings:text-foreground
                   prose-p:text-foreground
                   prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                   prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:rounded prose-code:px-1 prose-code:py-0.5
                   prose-pre:bg-muted prose-pre:text-foreground prose-pre:font-mono prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto
                   prose-li:marker:text-muted-foreground
                   prose-hr:border-border">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>
        </div>
      );

    case "file":
      if (!value)
        return <span className="text-muted-foreground italic">No file</span>;
      return (
        <FileViewer
          src={value.src}
          fileName={value.name || field.displayName}
          size="lg"
        />
      );

    case "file-multiple":
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-muted-foreground italic">No files</span>;
      }

      return (
        <div className="flex flex-wrap gap-2">
          {value.map((file, index) => {
            if (typeof file === "object" && file && file.src) {
              return (
                <FileViewer
                  key={file.id || index}
                  src={file.src}
                  fileName={file.name || `File ${index + 1}`}
                  size="md"
                />
              );
            } else {
              return null;
            }
          })}
        </div>
      );

    case "text":
    default:
      return <span>{String(value)}</span>;
  }
}

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "../ui/textarea";
import ReusableTabs from "./reusable-tabs";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  preview?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write markdown content...",
  minHeight = "150px",
  maxHeight = "400px",
  preview = true,
  className,
}: MarkdownEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return preview ? (
    <ReusableTabs
      tabs={[
        {
          id: "edit",
          label: "Edit",
          content: (
            <Textarea
              value={localValue}
              onChange={handleChange}
              placeholder={placeholder}
              style={{ minHeight, maxHeight }}
              className="font-mono"
            />
          ),
        },
        {
          id: "preview",
          label: "Preview",
          content: (
            <div
              className="prose dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-headings:text-foreground
                   prose-p:text-foreground
                   prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                   prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:rounded prose-code:px-1 prose-code:py-0.5
                   prose-pre:bg-muted prose-pre:text-foreground prose-pre:font-mono prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto
                   prose-li:marker:text-muted-foreground
                   prose-hr:border-border max-w-none border rounded-md p-3 overflow-auto"
              style={{ minHeight, maxHeight }}
            >
              {localValue ? (
                <ReactMarkdown>{localValue}</ReactMarkdown>
              ) : (
                <div className="text-muted-foreground">{placeholder}</div>
              )}
            </div>
          ),
        },
      ]}
      defaultTabId="edit"
      className={className}
      tabsListClassName="mb-2"
      tabsContentClassName="mt-0"
    />
  ) : (
    <Textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ minHeight, maxHeight }}
      className={`font-mono ${className}`}
    />
  );
}

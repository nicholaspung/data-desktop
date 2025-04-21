import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";

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
    <Tabs defaultValue="edit" className={className}>
      <TabsList className="mb-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-0">
        <Textarea
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ minHeight, maxHeight }}
          className="font-mono"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-0">
        <div
          className="prose dark:prose-invert max-w-none border rounded-md p-3 overflow-auto"
          style={{ minHeight, maxHeight }}
        >
          {localValue ? (
            <ReactMarkdown>{localValue}</ReactMarkdown>
          ) : (
            <div className="text-muted-foreground">{placeholder}</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
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

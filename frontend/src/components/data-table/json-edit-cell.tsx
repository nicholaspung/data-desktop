import React, { useState, useEffect } from "react";

import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface JsonEditCellProps {
  value: string | object | undefined | null;
  onChange: (parsedJson: any) => void;
  placeholder?: string;
  textareaClassName?: string;
  rows?: number;
}

export function JsonEditCell({
  value,
  onChange,
  placeholder = "Enter valid JSON...",
  textareaClassName = "font-mono resize-y",
  rows = 8,
}: JsonEditCellProps) {
  const [internalJsonString, setInternalJsonString] = useState<string>(() => {
    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value || {}, null, 2);
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let newFormattedValue;
    if (typeof value === "string") {
      newFormattedValue = value;
    } else {
      newFormattedValue = JSON.stringify(value || {}, null, 2);
    }

    if (newFormattedValue !== internalJsonString) {
      setInternalJsonString(newFormattedValue);

      if (error) setError(null);
    }
  }, [value]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalJsonString(event.target.value);

    if (error) {
      setError(null);
    }
  };

  const validateAndSaveChanges = () => {
    try {
      const parsedJson = JSON.parse(internalJsonString);
      onChange(parsedJson);
      setError(null);
      toast.success("JSON updated successfully");
    } catch (e) {
      let errorMessage = "Invalid JSON format. Please correct and try again.";
      if (e instanceof SyntaxError) {
        if (internalJsonString.trim() === "") {
          errorMessage =
            "JSON input is empty. Please enter valid JSON (e.g., {} for an empty object).";
        } else {
          errorMessage = `Invalid JSON: ${e.message}`;
        }
      }
      console.error("JSON parsing error:", e, { jsonText: internalJsonString });
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={internalJsonString}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={`${textareaClassName} ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        rows={rows}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={validateAndSaveChanges}
          variant="outline"
        >
          <Save className="h-4 w-4 mr-2" />
          Apply Changes
        </Button>
      </div>
      {error && <div className="text-sm text-destructive mt-1">{error}</div>}
    </div>
  );
}

// src/components/data-form/relation-field.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldDefinition } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RelationFieldProps {
  field: any; // React Hook Form field
  fieldDef: FieldDefinition;
  onChange: (value: string) => void;
}

export function RelationField({
  field,
  fieldDef,
  onChange,
}: RelationFieldProps) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    if (!fieldDef.relatedDataset) return;

    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords(fieldDef.relatedDataset);

      // Transform records to options with id and label
      const formattedOptions = records.map((record: any) => {
        // Create a meaningful label based on the dataset type
        const label = record.name || record.title || `ID: ${record.id}`;

        return {
          id: record.id,
          label,
        };
      });

      setOptions(formattedOptions);
    } catch (error) {
      console.error(
        `Error fetching related data for ${fieldDef.relatedDataset}:`,
        error
      );
      setError(`Failed to load ${fieldDef.displayName} options`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch related data when component mounts
  useEffect(() => {
    fetchRelatedData();
  }, [fieldDef.relatedDataset, fieldDef.displayName]);

  // If there are no options and we're not loading, display an alert with guidance
  if (!isLoading && options.length === 0) {
    return (
      <FormItem>
        <FormLabel>{fieldDef.displayName}</FormLabel>
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No {fieldDef.relatedDataset} records found. You need to create a
            record first.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={fetchRelatedData}
        >
          Refresh
        </Button>
        {fieldDef.description && (
          <FormDescription>{fieldDef.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  return (
    <FormItem>
      <FormLabel>{fieldDef.displayName}</FormLabel>
      <FormControl>
        <Select
          disabled={isLoading || options.length === 0}
          value={field.value || ""}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoading
                  ? "Loading options..."
                  : error
                    ? error
                    : `Select ${fieldDef.displayName}`
              }
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      {fieldDef.description && (
        <FormDescription>{fieldDef.description}</FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}

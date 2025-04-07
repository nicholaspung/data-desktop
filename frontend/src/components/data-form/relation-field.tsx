// src/components/data-form/relation-field.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStore } from "@tanstack/react-store";
import dataStore, { DataStoreName } from "@/store/data-store";
import loadingStore from "@/store/loading-store";

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
  const data =
    useStore(
      dataStore,
      (state) => state[fieldDef.relatedDataset as DataStoreName]
    ) || []; // Get data from the store
  const isLoading =
    useStore(
      loadingStore,
      (state) => state[fieldDef.relatedDataset as DataStoreName]
    ) || []; // Get data from the store
  // Transform data to options with id and label
  const options = data.map((record: any) => {
    // Create a meaningful label based on the dataset type
    const label = record.name || record.title || `ID: ${record.id}`;

    return {
      id: record.id,
      label,
    };
  });

  // If there are no options and we're not loading, display an alert with guidance
  if (options.length === 0) {
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
          disabled={options.length === 0}
          value={field.value || ""}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoading
                  ? "Loading options..."
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

// src/components/data-form/relation-field.tsx
import { AlertCircle } from "lucide-react";
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
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";
import ReusableSelect from "../reusable/reusable-select";

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
    ) || false; // Get data from the store
  // Transform data to options with id and label
  const options = generateOptionsForLoadRelationOptions(data, fieldDef);

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
        <ReusableSelect
          options={options}
          value={field.value}
          onChange={onChange}
          isLoading={isLoading}
          title={fieldDef.displayName}
        />
      </FormControl>
      {fieldDef.description && (
        <FormDescription>{fieldDef.description}</FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}

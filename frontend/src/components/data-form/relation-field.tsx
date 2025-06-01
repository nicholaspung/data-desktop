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
import { useFormContext } from "react-hook-form";

export function RelationField({
  field,
  fieldDef,
  onChange,
}: {
  field: any;
  fieldDef: FieldDefinition;
  onChange: (value: string) => void;
}) {
  const { formState } = useFormContext();
  const fieldError = formState.errors[fieldDef.key];
  const isUniqueError = fieldError?.type === "unique";
  
  const data =
    useStore(
      dataStore,
      (state) => state[fieldDef.relatedDataset as DataStoreName]
    ) || [];
  const isLoading =
    useStore(
      loadingStore,
      (state) => state[fieldDef.relatedDataset as DataStoreName]
    ) || false;

  const options = generateOptionsForLoadRelationOptions(data, fieldDef);

  if (options.length === 0) {
    return (
      <FormItem>
        <FormLabel className="flex items-center">
          {fieldDef.displayName}
          {!fieldDef.isOptional && <span className="text-destructive ml-1">*</span>}
          {fieldDef.isUnique && (
            <span 
              className={`ml-1 ${isUniqueError ? "text-destructive animate-pulse" : "text-orange-500"}`} 
              title="This field must be unique"
            >
              ⚡
            </span>
          )}
        </FormLabel>
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
      <FormLabel className="flex items-center">
        {fieldDef.displayName}
        {!fieldDef.isOptional && <span className="text-destructive ml-1">*</span>}
        {fieldDef.isUnique && (
          <span 
            className={`ml-1 ${isUniqueError ? "text-destructive animate-pulse" : "text-orange-500"}`} 
            title="This field must be unique"
          >
            ⚡
          </span>
        )}
      </FormLabel>
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

import { FieldDefinition } from "@/types/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Control, useFormContext } from "react-hook-form";
import { MarkdownEditor } from "../reusable/markdown-editor";

interface FormMarkdownFieldProps {
  field: FieldDefinition;
  control: Control<any>;
}

export function FormMarkdownField({ field, control }: FormMarkdownFieldProps) {
  const { formState } = useFormContext();
  const fieldError = formState.errors[field.key];
  const isUniqueError = fieldError?.type === "unique";
  
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem className="col-span-2">
          <FormLabel className="flex items-center">
            {field.displayName}
            {!field.isOptional && <span className="text-destructive ml-1">*</span>}
            {field.isUnique && (
              <span 
                className={`ml-1 ${isUniqueError ? "text-destructive animate-pulse" : "text-orange-500"}`} 
                title="This field must be unique"
              >
                ⚡
              </span>
            )}
          </FormLabel>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormControl>
            <MarkdownEditor
              value={formField.value || ""}
              onChange={formField.onChange}
              minHeight="200px"
              placeholder={`Enter ${field.displayName.toLowerCase()}...`}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

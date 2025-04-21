import { FieldDefinition } from "@/types/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Control } from "react-hook-form";
import { MarkdownEditor } from "../reusable/markdown-editor";

interface FormMarkdownFieldProps {
  field: FieldDefinition;
  control: Control<any>;
}

export function FormMarkdownField({ field, control }: FormMarkdownFieldProps) {
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem className="col-span-2">
          <FormLabel>
            {field.displayName}
            {field.isOptional ? null : (
              <span className="text-destructive ml-1">*</span>
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

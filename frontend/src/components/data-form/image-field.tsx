import { FieldDefinition } from "@/types/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Control } from "react-hook-form";
import ImageUpload from "../reusable/image-upload";

interface FormImageFieldProps {
  field: FieldDefinition;
  control: Control<any>;
}

export function FormImageField({ field, control }: FormImageFieldProps) {
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
            <ImageUpload
              value={formField.value || ""}
              onChange={formField.onChange}
              aspectRatio="1/1"
              maxSize={20}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

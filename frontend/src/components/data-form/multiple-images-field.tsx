import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Control } from "react-hook-form";
import MultipleImageUpload from "../reusable/multiple-image-upload";

interface FormMultipleImagesFieldProps {
  name: string;
  label: string;
  description?: string;
  control: Control<any>;
  maxImages?: number;
  required?: boolean;
  aspectRatio?: string;
}

export function FormMultipleImagesField({
  name,
  label,
  description,
  control,
  maxImages = 10,
  required = false,
  aspectRatio = "1/1",
}: FormMultipleImagesFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <MultipleImageUpload
              value={field.value || []}
              onChange={field.onChange}
              maxImages={maxImages}
              aspectRatio={aspectRatio}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

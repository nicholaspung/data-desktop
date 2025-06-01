import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Control, useFormContext } from "react-hook-form";
import FileUpload from "@/components/reusable/file-upload";

interface FileUploadFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  disabled?: boolean;
  maxSize?: number;
  acceptedTypes?: string;
  showPreview?: boolean;
}

export default function FileUploadField({
  control,
  name,
  label,
  description,
  required = false,
  unique = false,
  disabled = false,
  maxSize,
  acceptedTypes,
  showPreview,
}: FileUploadFieldProps) {
  const { formState } = useFormContext();
  const fieldError = formState.errors[name];
  const isUniqueError = fieldError?.type === "unique";
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
            {unique && (
              <span 
                className={`ml-1 ${isUniqueError ? "text-destructive animate-pulse" : "text-orange-500"}`} 
                title="This field must be unique"
              >
                ⚡
              </span>
            )}
          </FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <FileUpload
              value={field.value || null}
              onChange={field.onChange}
              className="w-full"
              maxSize={maxSize}
              acceptedTypes={acceptedTypes}
              showPreview={showPreview}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

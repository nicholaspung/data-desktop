// src/components/data-form/data-form.tsx
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { FieldDefinition } from "@/types";

interface DataFormProps {
  datasetId: string;
  fields: FieldDefinition[];
  onSuccess?: () => void;
  initialValues?: Record<string, any>;
  submitLabel?: string;
  successMessage?: string;
  mode?: "add" | "edit";
  recordId?: string;
  hideSubmitButton?: boolean;
}

export default function DataForm({
  datasetId,
  fields,
  onSuccess,
  initialValues = {},
  submitLabel = "Save",
  successMessage = "Data saved successfully",
  mode = "add",
  recordId,
  hideSubmitButton = false,
}: DataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a dynamic schema from the field definitions
  const { schema, defaultValues } = useMemo(() => {
    // Create schema object and default values
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const defaults: Record<string, any> = {};

    // Process each field to build schema and defaults
    fields.forEach((field) => {
      switch (field.type) {
        case "date":
          schemaObj[field.key] = z.date({
            required_error: `${field.displayName} is required`,
          });

          // Use initial value or default to current date
          if (initialValues[field.key]) {
            defaults[field.key] = new Date(initialValues[field.key]);
          } else {
            defaults[field.key] = new Date();
          }
          break;

        case "boolean":
          schemaObj[field.key] = z.boolean().default(false);
          defaults[field.key] = initialValues[field.key] ?? false;
          break;

        case "number":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0");
          defaults[field.key] = initialValues[field.key] ?? 0;
          break;

        case "percentage":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0")
            .max(100, "Must be less than 100");
          defaults[field.key] = initialValues[field.key] ?? 0;
          break;

        case "text":
          schemaObj[field.key] = z
            .string()
            .min(1, `${field.displayName} is required`);
          defaults[field.key] = initialValues[field.key] ?? "";
          break;
      }
    });

    return {
      schema: z.object(schemaObj),
      defaultValues: defaults,
    };
  }, [fields, initialValues]);

  // Initialize the form with our schema and default values
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  // Handle form submission
  const onSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await ApiService.addRecord(datasetId, values);
      } else if (mode === "edit" && recordId) {
        await ApiService.updateRecord(recordId, values);
      }

      toast.success(successMessage);

      // Don't reset the form on edit mode to allow for consecutive edits
      if (mode === "add") {
        form.reset(defaultValues);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(
        `Error ${mode === "add" ? "adding" : "updating"} record:`,
        error
      );
      toast.error(`Failed to ${mode === "add" ? "add" : "update"} record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group fields by type for consistent organization
  const fieldsByType = {
    date: fields.filter((field) => field.type === "date"),
    boolean: fields.filter((field) => field.type === "boolean"),
    numeric: fields.filter(
      (field) => field.type === "number" || field.type === "percentage"
    ),
    text: fields.filter((field) => field.type === "text"),
  };

  // Render a field based on its type
  const renderField = (field: FieldDefinition) => {
    switch (field.type) {
      case "date":
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{field.displayName}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formField.value && "text-muted-foreground"
                        )}
                      >
                        {formField.value ? (
                          format(new Date(formField.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formField.value instanceof Date
                          ? formField.value
                          : new Date(formField.value)
                      }
                      onSelect={formField.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "boolean":
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.displayName}</FormLabel>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                </div>
              </FormItem>
            )}
          />
        );

      case "number":
      case "percentage":
        return (
          <Controller
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    max={field.type === "percentage" ? "100" : undefined}
                    value={formField.value}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const value = rawValue === "" ? 0 : parseFloat(rawValue);
                      formField.onChange(value);
                    }}
                    onBlur={formField.onBlur}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>
                    {field.description}
                    {field.unit ? ` (${field.unit})` : ""}
                  </FormDescription>
                )}
                {fieldState.error && (
                  <FormMessage>{fieldState.error.message}</FormMessage>
                )}
              </FormItem>
            )}
          />
        );

      case "text":
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input {...formField} />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date fields */}
        {fieldsByType.date.length > 0 && (
          <div className="space-y-4">{fieldsByType.date.map(renderField)}</div>
        )}

        {/* Boolean fields */}
        {fieldsByType.boolean.length > 0 && (
          <div className="space-y-4">
            {fieldsByType.boolean.map(renderField)}
          </div>
        )}

        {/* Numeric and text fields in a grid */}
        {(fieldsByType.numeric.length > 0 || fieldsByType.text.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {fieldsByType.numeric.map(renderField)}
            {fieldsByType.text.map(renderField)}
          </div>
        )}

        {!hideSubmitButton && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        )}
      </form>
    </Form>
  );
}

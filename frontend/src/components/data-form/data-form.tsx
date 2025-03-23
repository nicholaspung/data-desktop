// src/components/data-form/data-form.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
}: DataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSchema, setFormSchema] = useState<z.ZodTypeAny>(z.object({}));
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});

  // Dynamically build the form schema and default values from field definitions
  useEffect(() => {
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const defaults: Record<string, any> = { ...initialValues };

    fields.forEach((field) => {
      // Add field to schema based on its type
      switch (field.type) {
        case "date":
          schemaObj[field.key] = z.date({
            required_error: `${field.displayName} is required`,
          });
          // Use initial value or default to current date
          if (!defaults[field.key]) {
            defaults[field.key] = new Date();
          } else if (!(defaults[field.key] instanceof Date)) {
            defaults[field.key] = new Date(defaults[field.key]);
          }
          break;

        case "boolean":
          schemaObj[field.key] = z.boolean().default(false);
          // Use initial value or default to false
          if (defaults[field.key] === undefined) {
            defaults[field.key] = false;
          }
          break;

        case "number":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0");
          // Use initial value or default to 0
          if (defaults[field.key] === undefined) {
            defaults[field.key] = 0;
          }
          break;

        case "percentage":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0")
            .max(100, "Must be less than 100");
          // Use initial value or default to 0
          if (defaults[field.key] === undefined) {
            defaults[field.key] = 0;
          }
          break;

        case "text":
          schemaObj[field.key] = z
            .string()
            .min(1, `${field.displayName} is required`);
          // Use initial value or default to empty string
          if (defaults[field.key] === undefined) {
            defaults[field.key] = "";
          }
          break;
      }
    });

    setFormSchema(z.object(schemaObj));
    setDefaultValues(defaults);
  }, [fields, initialValues]);

  // Initialize form with dynamic schema and defaults
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    values: defaultValues, // This ensures form updates when defaults change
  });

  const onSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await ApiService.addRecord(datasetId, values);
      } else if (mode === "edit" && recordId) {
        await ApiService.updateRecord(recordId, values);
      }

      toast.success(successMessage);
      form.reset(defaultValues);

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

  // Generate form fields dynamically based on field definitions
  const renderFormField = (field: FieldDefinition) => {
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
                        variant={"outline"}
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
                        formField.value ? new Date(formField.value) : undefined
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
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={field.type === "percentage" ? "100" : undefined}
                    {...formField}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>
                    {field.description}
                    {field.unit ? ` (${field.unit})` : ""}
                  </FormDescription>
                )}
                <FormMessage />
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

  // Group fields by category for better organization
  const dateFields = fields.filter((field) => field.type === "date");
  const booleanFields = fields.filter((field) => field.type === "boolean");
  const numericFields = fields.filter(
    (field) => field.type === "number" || field.type === "percentage"
  );
  const textFields = fields.filter((field) => field.type === "text");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date fields */}
        {dateFields.length > 0 && (
          <div className="space-y-4">{dateFields.map(renderFormField)}</div>
        )}

        {/* Boolean fields */}
        {booleanFields.length > 0 && (
          <div className="space-y-4">{booleanFields.map(renderFormField)}</div>
        )}

        {/* Numeric and text fields in a grid */}
        {(numericFields.length > 0 || textFields.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {numericFields.map(renderFormField)}
            {textFields.map(renderFormField)}
          </div>
        )}

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
      </form>
    </Form>
  );
}

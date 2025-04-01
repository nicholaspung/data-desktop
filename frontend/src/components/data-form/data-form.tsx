// Updated version of frontend/src/components/data-form/data-form.tsx
import { useState, useEffect, useMemo } from "react";
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
import { CalendarIcon, Loader2, Trash2, X } from "lucide-react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { FieldDefinition } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataFormProps {
  datasetId: string;
  fields: FieldDefinition[];
  onSuccess?: (recordId: string) => void;
  onCancel?: () => void;
  initialValues?: Record<string, any>;
  submitLabel?: string;
  successMessage?: string;
  mode?: "add" | "edit";
  recordId?: string;
  hideSubmitButton?: boolean;
  persistKey?: string; // Optional key for local storage persistence
}

export default function DataForm({
  datasetId,
  fields,
  onSuccess,
  onCancel,
  initialValues = {},
  submitLabel = "Save",
  successMessage = "Data saved successfully",
  mode = "add",
  recordId,
  hideSubmitButton = false,
  persistKey,
}: DataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Generate storage key for this form
  const storageKey = persistKey || `form_${datasetId}_data`;

  // Utility function to create fresh default values
  const createFreshDefaultValues = () => {
    const freshDefaults: Record<string, any> = {};

    // Set initial values for each field type
    fields.forEach((field) => {
      switch (field.type) {
        case "date":
          freshDefaults[field.key] = new Date();
          break;
        case "boolean":
          freshDefaults[field.key] = false;
          break;
        case "number":
        case "percentage":
          freshDefaults[field.key] = 0;
          break;
        case "text":
          freshDefaults[field.key] = "";
          break;
      }
    });

    return freshDefaults;
  };

  // Utility function to completely reset the form
  const completeFormReset = () => {
    // Create fresh default values
    const freshDefaults = createFreshDefaultValues();

    // Reset the form with the fresh defaults
    form.reset(freshDefaults, {
      keepDirty: false,
      keepErrors: false,
      keepDirtyValues: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });

    // Clear localStorage
    localStorage.removeItem(storageKey);
  };

  // Load persisted data from localStorage on initial render
  const getInitialValues = () => {
    if (mode === "edit" && Object.keys(initialValues).length > 0) {
      // For edit mode, prioritize passed initialValues
      return initialValues;
    }

    // Get fresh default values
    const freshDefaults = createFreshDefaultValues();

    // For add mode, try to get saved form data from local storage
    if (mode === "add") {
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Convert date strings back to Date objects
          fields.forEach((field) => {
            if (
              field.type === "date" &&
              parsedData[field.key] &&
              typeof parsedData[field.key] === "string"
            ) {
              parsedData[field.key] = new Date(parsedData[field.key]);
            }
          });

          return { ...freshDefaults, ...parsedData };
        }
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }

    // Merge the fresh defaults with any provided initialValues
    return { ...freshDefaults, ...initialValues };
  };

  // Generate a dynamic schema from the field definitions
  const { schema, defaultValues } = useMemo(() => {
    // Create schema object and default values
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const defaults: Record<string, any> = getInitialValues();

    // Process each field to build schema and defaults
    fields.forEach((field) => {
      switch (field.type) {
        case "date":
          schemaObj[field.key] = z.date({
            required_error: `${field.displayName} is required`,
          });

          // Set default value for date if not already in defaults
          if (!defaults[field.key]) {
            defaults[field.key] = new Date();
          } else if (typeof defaults[field.key] === "string") {
            defaults[field.key] = new Date(defaults[field.key]);
          }
          break;

        case "boolean":
          schemaObj[field.key] = z.boolean().default(false);
          defaults[field.key] = defaults[field.key] ?? false;
          break;

        case "number":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0");
          defaults[field.key] = defaults[field.key] ?? 0;
          break;

        case "percentage":
          schemaObj[field.key] = z.coerce
            .number({ required_error: `${field.displayName} is required` })
            .min(0, "Must be at least 0")
            .max(100, "Must be less than 100");
          defaults[field.key] = defaults[field.key] ?? 0;
          break;

        case "text":
          schemaObj[field.key] = z
            .string()
            .min(1, `${field.displayName} is required`);
          defaults[field.key] = defaults[field.key] ?? "";
          break;
      }
    });

    return {
      schema: z.object(schemaObj),
      defaultValues: defaults,
    };
  }, [fields, initialValues, mode, storageKey]);

  // Initialize the form with our schema and default values
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  // Save form values to localStorage whenever they change
  useEffect(() => {
    const subscription = form.watch((values) => {
      // Only save to localStorage in "add" mode
      if (mode === "add") {
        try {
          // Convert Date objects to ISO strings for safe storage
          const safeValues = { ...values };
          Object.keys(safeValues).forEach((key) => {
            if (safeValues[key] instanceof Date) {
              safeValues[key] = safeValues[key].toISOString();
            }
          });

          localStorage.setItem(storageKey, JSON.stringify(safeValues));
        } catch (error) {
          console.error("Error saving form data to localStorage:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, mode, storageKey]);

  // Handle form submission
  const onSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      let response;

      if (mode === "add") {
        response = await ApiService.addRecord(datasetId, values);

        // After successful submission, completely reset the form
        completeFormReset();
      } else if (mode === "edit" && recordId) {
        response = await ApiService.updateRecord(recordId, values);
      }

      toast.success(successMessage);

      if (onSuccess && response && response.id) {
        // Pass the record ID to the success callback
        onSuccess(response.id);
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

  // Clear form data and localStorage
  const handleClearForm = () => {
    completeFormReset();
    setClearConfirmOpen(false);
    toast.info("Form data has been cleared");
  };

  // Handle cancel button click
  const handleCancel = () => {
    completeFormReset();
    if (onCancel) {
      onCancel();
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
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

              {mode === "add" && (
                <AlertDialog
                  open={clearConfirmOpen}
                  onOpenChange={setClearConfirmOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" type="button">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear form data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all form fields and delete any saved
                        data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearForm}>
                        Clear
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {onCancel && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancel}
                className="sm:ml-2"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}

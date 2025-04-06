// src/components/data-form/data-form.tsx
import { useState, useEffect, useMemo, useRef } from "react";
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
import { CalendarIcon, Loader2, UndoDot, X } from "lucide-react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { FieldDefinition } from "@/types/types";
import { ConfirmResetDialog } from "../reusable/confirm-reset-dialog";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { RelationField } from "./relation-field";
import SavedDataBadge from "../reusable/saved-data-badge";
import {
  createFreshDefaultValues,
  getFieldsByType,
  hasNonEmptyValues,
} from "@/lib/form-utils";

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
  onChange?: (values: Record<string, any>, isValid: boolean) => void; // New callback for form changes
  forceClear?: boolean; // Signal to clear all data including localStorage
  title?: string; // Optional title for the form
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
  onChange, // New callback for form changes
  forceClear = false, // Signal to clear all data including localStorage
  title, // Optional title for the form
}: DataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedLocal = useRef(false);

  // Generate storage key for this form
  const storageKey = persistKey || `form_${datasetId}_data`;

  // Function to load data from localStorage
  const loadSavedData = () => {
    // Only check localStorage in add mode
    if (mode !== "add" || hasCheckedLocal.current) return null;

    hasCheckedLocal.current = true;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      // Process date fields
      const processedData = { ...parsedData };
      fields.forEach((field) => {
        if (field.type === "date" && processedData[field.key]) {
          processedData[field.key] = new Date(processedData[field.key]);
        }
      });

      // Check if saved data has meaningful content
      if (hasNonEmptyValues(processedData, fields)) {
        // Schedule this to avoid state updates during render
        setTimeout(() => {
          setHasSavedData(true);
          toast.info("Restored your previously saved form data");
        }, 0);
        return processedData;
      } else {
        // Clean up localStorage if no meaningful data
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error);
    }

    return null;
  };

  // Function to save form data to localStorage with debounce
  const saveToLocalStorage = (data: Record<string, any>) => {
    // Only save in add mode
    if (mode !== "add") return;

    // Clear any previous save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save the data
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Check if there's meaningful data to save
        if (hasNonEmptyValues(data, fields)) {
          // Process data for storage
          const processedData = { ...data };

          // Convert dates to ISO strings
          fields.forEach((field) => {
            if (
              field.type === "date" &&
              processedData[field.key] instanceof Date
            ) {
              processedData[field.key] = processedData[field.key].toISOString();
            }
          });

          localStorage.setItem(storageKey, JSON.stringify(processedData));
          setHasSavedData(true);
        } else {
          localStorage.removeItem(storageKey);
          setHasSavedData(false);
        }
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }, 500); // Debounce delay
  };

  // Utility function to completely reset the form
  const completeFormReset = () => {
    // Create fresh default values
    const freshDefaults = createFreshDefaultValues(fields);

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
    setHasSavedData(false);

    // Report empty and invalid form state via onChange if provided
    if (onChange) {
      onChange(freshDefaults, false);
    }
  };

  // Calculate initial values for the form
  const getInitialValues = useMemo(() => {
    // For edit mode, use provided initialValues
    if (mode === "edit" && Object.keys(initialValues).length > 0) {
      return initialValues;
    }

    // Start with fresh defaults
    const freshDefaults = createFreshDefaultValues(fields);

    // In add mode, try to load from localStorage
    const savedData = loadSavedData();

    // Combine in order: defaults -> localStorage -> provided initialValues
    return { ...freshDefaults, ...(savedData || {}), ...initialValues };
  }, []);

  // Generate schema from field definitions
  const schema = useMemo(() => {
    const schemaObj: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
      // Check if field should be optional
      const isOptional = field.isOptional === true;

      // Handle relation fields
      if (field.isRelation) {
        schemaObj[field.key] = isOptional
          ? z.string().optional()
          : z.string({
              required_error: `${field.displayName} is required`,
            });
        return;
      }

      switch (field.type) {
        case "date":
          schemaObj[field.key] = isOptional
            ? z.date().optional()
            : z.date({
                required_error: `${field.displayName} is required`,
              });
          break;
        case "boolean":
          schemaObj[field.key] = z.boolean().default(false);
          break;
        case "number":
          schemaObj[field.key] = isOptional
            ? z.coerce.number().min(0, "Must be at least 0").optional()
            : z.coerce
                .number({ required_error: `${field.displayName} is required` })
                .min(0, "Must be at least 0");
          break;
        case "percentage":
          schemaObj[field.key] = isOptional
            ? z.coerce
                .number()
                .min(0, "Must be at least 0")
                .max(100, "Must be less than 100")
                .optional()
            : z.coerce
                .number({ required_error: `${field.displayName} is required` })
                .min(0, "Must be at least 0")
                .max(100, "Must be less than 100");
          break;
        case "text":
          schemaObj[field.key] = isOptional
            ? z.string().optional()
            : z.string().min(1, `${field.displayName} is required`);
          break;
      }
    });

    return z.object(schemaObj);
  }, [fields]);

  // Initialize the form with our schema and default values
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues,
    mode: "onBlur",
  });

  // Watch for forceClear prop changes
  useEffect(() => {
    if (forceClear) {
      completeFormReset();
    }
  }, [forceClear]);

  // Add form watching with debounce for localStorage
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (mode === "add") {
        saveToLocalStorage(formValues as Record<string, any>);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, mode]);

  // Add effect for onChange callback
  useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((formValues) => {
      const timeoutId = setTimeout(() => {
        const hasChanges = form.formState.isDirty;
        const isValid =
          Object.keys(form.formState.errors).length === 0 && hasChanges;
        onChange(formValues as Record<string, any>, isValid);
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

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
    toast.info("Form data has been cleared");
  };

  // Handle cancel button click
  const handleCancel = () => {
    completeFormReset();
    if (onCancel) {
      onCancel();
    }
  };

  // Render a field based on its type
  const renderField = (field: FieldDefinition) => {
    if (field.isRelation) {
      return (
        <FormField
          key={field.key}
          control={form.control}
          name={field.key}
          render={({ field: formField }) => (
            <RelationField
              field={formField}
              fieldDef={field}
              onChange={(value: string) => {
                formField.onChange(value);
                // Trigger validation
                form.trigger(field.key);
              }}
            />
          )}
        />
      );
    }

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
                      onSelect={(date) => {
                        formField.onChange(date);
                        // Trigger validation
                        form.trigger(field.key);
                      }}
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
            render={({ field: formField }) => {
              // Compare with default value to determine if it has changed
              const defaultValue = getInitialValues[field.key] === true;

              return (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={formField.value}
                      onCheckedChange={(checked) => {
                        formField.onChange(checked);
                        // Manually track if this is different from default
                        form.setValue(field.key, checked, {
                          shouldDirty: checked !== defaultValue,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{field.displayName}</FormLabel>
                    {field.description && (
                      <FormDescription>{field.description}</FormDescription>
                    )}
                  </div>
                </FormItem>
              );
            }}
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
                      // Trigger validation
                      form.trigger(field.key);
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
                  <Input
                    {...formField}
                    onChange={(e) => {
                      formField.onChange(e);
                      // Trigger validation
                      form.trigger(field.key);
                    }}
                  />
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

  const fieldsByType = getFieldsByType(fields);

  const FormComponent = ({ noSavedBadge }: { noSavedBadge?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Show saved data badge if we have saved data in localStorage */}
        {!noSavedBadge && hasSavedData && mode === "add" && (
          <div className="flex justify-end mb-2">
            <SavedDataBadge />
          </div>
        )}

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
                <ConfirmResetDialog
                  onConfirm={handleClearForm}
                  title="Clear form data?"
                  description="This will reset all form fields and delete any saved data. This action cannot be undone."
                  trigger={
                    <Button
                      variant="outline"
                      size="default"
                      disabled={isSubmitting}
                    >
                      <UndoDot className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  }
                />
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

  // Render the form with or without a title
  if (title) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex flex-row justify-between items-center w-full mb-4">
            <span className="flex-1">{title}</span>
            {hasSavedData && mode === "add" && (
              <Badge
                variant="outline"
                className="bg-blue-100 dark:bg-blue-900 px-2 py-1"
              >
                <span className="text-xs">Saved data</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormComponent noSavedBadge />
        </CardContent>
      </Card>
    );
  }

  // Basic form without Card wrapper
  return <FormComponent />;
}

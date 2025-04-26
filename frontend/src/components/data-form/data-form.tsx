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
import { CalendarIcon } from "lucide-react";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { FieldDefinition } from "@/types/types";
import { RelationField } from "./relation-field";
import { createFreshDefaultValues, hasNonEmptyValues } from "@/lib/form-utils";
import { addEntry, DataStoreName, updateEntry } from "@/store/data-store";
import SavedDataBadge from "../reusable/saved-data-badge";
import DataFormContent from "./data-form-content";
import ReusableSelect from "../reusable/reusable-select";
import ReusableMultiSelect from "../reusable/reusable-multiselect";
import { FormMarkdownField } from "./markdown-field";
import ReusableCard from "../reusable/reusable-card";

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
  onChange,
  forceClear = false,
  title,
}: {
  datasetId: DataStoreName;
  fields: FieldDefinition[];
  onSuccess?: (recordId: string) => void;
  onCancel?: () => void;
  initialValues?: Record<string, any>;
  submitLabel?: string;
  successMessage?: string;
  mode?: "add" | "edit";
  recordId?: string;
  hideSubmitButton?: boolean;
  persistKey?: string;
  onChange?: (values: Record<string, any>, isValid: boolean) => void;
  forceClear?: boolean;
  title?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedLocal = useRef(false);

  const storageKey = persistKey || `form_${datasetId}_data`;

  const loadSavedData = () => {
    if (mode !== "add" || hasCheckedLocal.current) return null;

    hasCheckedLocal.current = true;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      const processedData = { ...parsedData };
      fields.forEach((field) => {
        if (field.type === "date" && processedData[field.key]) {
          processedData[field.key] = new Date(processedData[field.key]);
        }
      });

      if (hasNonEmptyValues(processedData, fields)) {
        setTimeout(() => {
          setHasSavedData(true);
          toast.info("Restored your previously saved form data");
        }, 0);
        return processedData;
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error);
    }

    return null;
  };

  const saveToLocalStorage = (data: Record<string, any>) => {
    if (mode !== "add") return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (hasNonEmptyValues(data, fields)) {
          const processedData = { ...data };

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
    }, 500);
  };

  const completeFormReset = () => {
    const freshDefaults = createFreshDefaultValues(fields);

    form.reset(freshDefaults, {
      keepDirty: false,
      keepErrors: false,
      keepDirtyValues: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });

    localStorage.removeItem(storageKey);
    setHasSavedData(false);

    if (onChange) {
      onChange(freshDefaults, false);
    }
  };

  const getInitialValues = useMemo(() => {
    if (mode === "edit" && Object.keys(initialValues).length > 0) {
      return initialValues;
    }

    const freshDefaults = createFreshDefaultValues(fields);

    const savedData = loadSavedData();

    return { ...freshDefaults, ...(savedData || {}), ...initialValues };
  }, []);

  const schema = useMemo(() => {
    const schemaObj: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
      const isOptional = field.isOptional === true;

      if (field.isRelation) {
        schemaObj[field.key] = isOptional
          ? z.string().optional()
          : z.string({
              required_error: `${field.displayName} is required`,
            });
        return;
      }

      if (field.options) {
        const validOptions = field.options.map((option) => option.id);

        if (field.type === "select-single") {
          if (isOptional) {
            schemaObj[field.key] = z
              .string()
              .optional()
              .refine((val) => !val || validOptions.includes(val), {
                message: `Invalid option for ${field.displayName}`,
              });
          } else {
            schemaObj[field.key] = z
              .string({
                required_error: `${field.displayName} is required`,
              })
              .refine((val) => validOptions.includes(val), {
                message: `Invalid option for ${field.displayName}`,
              });
          }
        } else if (field.type === "select-multiple") {
          if (isOptional) {
            schemaObj[field.key] = z
              .array(z.string())
              .optional()
              .refine(
                (val) =>
                  !val || val.every((item) => validOptions.includes(item)),
                {
                  message: `Invalid options for ${field.displayName}`,
                }
              );
          } else {
            schemaObj[field.key] = z
              .array(z.string(), {
                required_error: `${field.displayName} is required`,
              })
              .min(1, `At least one ${field.displayName} must be selected`)
              .refine(
                (val) => val.every((item) => validOptions.includes(item)),
                {
                  message: `Invalid options for ${field.displayName}`,
                }
              );
          }
        }

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
        case "markdown":
          schemaObj[field.key] = isOptional
            ? z.string().optional()
            : z.string().min(1, `${field.displayName} is required`);
          break;
      }
    });

    return z.object(schemaObj);
  }, [fields]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (forceClear) {
      completeFormReset();
    }
  }, [forceClear]);

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

  const onSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      let response;

      if (mode === "add") {
        response = await ApiService.addRecord(datasetId, values);

        completeFormReset();

        if (response) {
          addEntry(response, datasetId);
        }
      } else if (mode === "edit" && recordId) {
        response = await ApiService.updateRecord(recordId, values);
        if (response) {
          updateEntry(recordId, response, datasetId);
        }
      }

      toast.success(successMessage);

      if (onSuccess && response && response.id) {
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

  const handleClearForm = () => {
    completeFormReset();
    toast.info("Form data has been cleared");
  };

  const handleCancel = () => {
    completeFormReset();
    if (onCancel) {
      onCancel();
    }
  };

  const fieldsByType = {
    date: fields.filter((field) => field.type === "date"),
    boolean: fields.filter((field) => field.type === "boolean"),
    numeric: fields.filter(
      (field) => field.type === "number" || field.type === "percentage"
    ),
    text: fields.filter((field) => field.type === "text"),
    markdown: fields.filter((field) => field.type === "markdown"),
    selectSingle: fields.filter((field) => field.type === "select-single"),
    selectMultiple: fields.filter((field) => field.type === "select-multiple"),
  };

  const renderField = (field: FieldDefinition) => {
    if (field.isRelation) {
      return (
        <FormField
          key={field.key}
          control={form.control}
          name={field.key}
          render={({
            field: formField,
          }: {
            field: {
              value: string;
              onChange: (value: string) => void;
              onBlur: () => void;
              name: string;
              ref: React.Ref<any>;
            };
          }) => (
            <RelationField
              field={formField}
              fieldDef={field}
              onChange={(value: string) => {
                formField.onChange(value);
                form.trigger(field.key);
              }}
            />
          )}
        />
      );
    }

    if (Array.isArray(field.options)) {
      if (field.type === "select-single") {
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <ReusableSelect
                    options={field.options || []}
                    value={formField.value}
                    onChange={(value) => {
                      formField.onChange(value);
                      form.trigger(field.key);
                    }}
                    title={field.displayName}
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
      } else if (field.type === "select-multiple") {
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <ReusableMultiSelect
                    options={field.options || []}
                    selected={formField.value}
                    onChange={(value) => {
                      formField.onChange(value);
                      form.trigger(field.key);
                    }}
                    title={field.displayName}
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
      }
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
                        form.trigger(field.key);
                      }}
                      disabled={(date) =>
                        field.isOptional
                          ? false
                          : date > new Date() || date < new Date("1900-01-01")
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
              const defaultValue = getInitialValues[field.key] === true;

              return (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={formField.value}
                      onCheckedChange={(checked) => {
                        formField.onChange(checked);
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

      case "markdown":
        return (
          <FormMarkdownField
            key={field.key}
            field={field}
            control={form.control}
          />
        );
      default:
        return null;
    }
  };

  return title ? (
    <ReusableCard
      title={
        <span className="flex flex-row justify-between items-center w-full mb-4">
          <span className="flex-1">{title}</span>
          {hasSavedData && mode === "add" && <SavedDataBadge />}
        </span>
      }
      content={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DataFormContent
              fieldsByType={fieldsByType}
              hideSubmitButton={hideSubmitButton}
              isSubmitting={isSubmitting}
              submitLabel={submitLabel}
              mode={mode}
              handleClearForm={handleClearForm}
              handleCancel={handleCancel}
              onCancel={onCancel}
              renderField={renderField}
            />
          </form>
        </Form>
      }
    />
  ) : (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DataFormContent
          fieldsByType={fieldsByType}
          hideSubmitButton={hideSubmitButton}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          mode={mode}
          handleClearForm={handleClearForm}
          handleCancel={handleCancel}
          onCancel={onCancel}
          renderField={renderField}
        />
      </form>
    </Form>
  );
}

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import TagInput from "@/components/reusable/tag-input";
import { FormJsonField } from "./json-field";
import FileUploadField from "./file-upload-field";
import MultipleFileUploadField from "./multiple-file-upload-field";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";

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
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  successMessage?: string;
  mode?: "add" | "edit";
  recordId?: string;
  hideSubmitButton?: boolean;
  persistKey?: string;
  onChange?: (values: Record<string, unknown>, isValid: boolean) => void;
  forceClear?: boolean;
  title?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedLocal = useRef(false);

  const storageKey = persistKey || `form_${datasetId}_data`;

  const storeData = useStore(dataStore, (state) => state[datasetId] || []);

  const getAutocompleteOptions = (field: FieldDefinition) => {
    if (field.type !== "autocomplete") return [];

    const existingValues = Array.from(
      new Set(
        storeData
          .map((record: any) => record[field.key])
          .filter(
            (value: any) =>
              value && typeof value === "string" && value.trim() !== ""
          )
      )
    ).sort();

    return existingValues.map((value: string) => ({
      id: value,
      label: value,
    }));
  };

  const loadSavedData = useCallback(() => {
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
  }, [mode, storageKey, fields]);

  const saveToLocalStorage = useCallback(
    (data: Record<string, unknown>) => {
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
                processedData[field.key] = (
                  processedData[field.key] as Date
                ).toISOString();
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
    },
    [mode, fields, storageKey]
  );

  const getInitialValues = useMemo(() => {
    if (mode === "edit" && Object.keys(initialValues).length > 0) {
      return initialValues;
    }

    const freshDefaults = createFreshDefaultValues(fields);

    const savedData = loadSavedData();

    return { ...freshDefaults, ...(savedData || {}), ...initialValues };
  }, [mode, fields, initialValues, loadSavedData]);

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

      const singleFileItemSchema = z
        .object({
          id: z.string(),
          src: z.string(),
          name: z.string(),
          type: z.string().optional(),
        })
        .passthrough();

      const fileItemSchema = z
        .object({
          id: z.string(),
          src: z.string(),
          name: z.string(),
          type: z.string().optional(),
          order: z.number(),
        })
        .passthrough();

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
        case "tags":
        case "autocomplete":
          schemaObj[field.key] = isOptional
            ? z.string().optional()
            : z.string().min(1, `${field.displayName} is required`);
          break;
        case "file":
          schemaObj[field.key] = isOptional
            ? singleFileItemSchema.optional()
            : singleFileItemSchema;
          break;
        case "json":
          schemaObj[field.key] = isOptional
            ? z.object({}).passthrough().optional()
            : z
                .object({})
                .passthrough()
                .refine((val) => val !== null && typeof val === "object", {
                  message: `${field.displayName} must be a valid object`,
                });
          break;
        case "file-multiple":
          schemaObj[field.key] = isOptional
            ? z.array(fileItemSchema).optional()
            : z
                .array(fileItemSchema)
                .min(
                  1,
                  isOptional
                    ? undefined
                    : `At least one file is required for ${field.displayName}`
                );
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

  const completeFormReset = useCallback(() => {
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
  }, [fields, storageKey, onChange, form]);

  useEffect(() => {
    if (forceClear) {
      completeFormReset();
    }
  }, [forceClear, completeFormReset]);

  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (mode === "add") {
        saveToLocalStorage(formValues as Record<string, unknown>);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, mode, saveToLocalStorage]);

  useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((formValues) => {
      const timeoutId = setTimeout(() => {
        const hasChanges = form.formState.isDirty;
        const isValid =
          Object.keys(form.formState.errors).length === 0 && hasChanges;
        onChange(formValues as Record<string, unknown>, isValid);
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const processedValues = { ...values };

      fields.forEach((field) => {
        if (
          field.type === "file" &&
          typeof processedValues[field.key] === "object" &&
          processedValues[field.key] !== null
        ) {
          const file = processedValues[field.key] as Record<string, unknown>;
          const fileId = (file.id as string) || crypto.randomUUID();
          processedValues[field.key] = {
            id: fileId,
            src: (file.src as string) || "",
            name: (file.name as string) || `${fileId}`,
            type: (file.type as string) || "",
          };
        }

        if (
          field.type === "file-multiple" &&
          Array.isArray(processedValues[field.key])
        ) {
          processedValues[field.key] = (
            processedValues[field.key] as unknown[]
          ).map((file: unknown) => {
            if (
              typeof file === "object" &&
              file !== null &&
              "id" in file &&
              "src" in file &&
              "name" in file &&
              "order" in file &&
              typeof (file as Record<string, unknown>).order === "number"
            ) {
              return file;
            }

            const fileRecord = file as Record<string, unknown>;
            const fileId = (fileRecord.id as string) || crypto.randomUUID();
            return {
              id: fileId,
              src: (fileRecord.src as string) || "",
              name: (fileRecord.name as string) || `${fileId}`,
              type: (fileRecord.type as string) || "",
              order:
                typeof fileRecord.order === "number" ? fileRecord.order : 0,
            };
          });
        }
      });

      let response;

      if (mode === "add") {
        response = await ApiService.addRecord(datasetId, processedValues);

        if (response) {
          addEntry(response, datasetId);
          completeFormReset();
        }
      } else if (mode === "edit" && recordId) {
        response = await ApiService.updateRecord(recordId, processedValues);
        if (response) {
          updateEntry(recordId, response, datasetId);
        }
      }

      if (onSuccess && response && response.id) {
        toast.success(successMessage);
        onSuccess(response.id);
      }
    } catch (error) {
      console.error(
        `Error ${mode === "add" ? "adding" : "updating"} record:`,
        error
      );

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("must be unique")) {
        const fieldMatch = errorMessage.match(/field '([^']+)' must be unique/);
        const fieldName = fieldMatch ? fieldMatch[1] : null;

        if (fieldName) {
          const field = fields.find((f) => f.displayName === fieldName);

          if (field) {
            form.setError(field.key, {
              type: "unique",
              message: `This ${field.displayName.toLowerCase()} already exists. Please choose a different value.`,
            });
          }
        }

        toast.error("Please fix the unique field conflicts and try again");
      } else {
        toast.error(`Failed to ${mode === "add" ? "add" : "update"} record`);
      }
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
    autocomplete: fields.filter((field) => field.type === "autocomplete"),
    tags: fields.filter((field) => field.type === "tags"),
    markdown: fields.filter((field) => field.type === "markdown"),
    selectSingle: fields.filter((field) => field.type === "select-single"),
    selectMultiple: fields.filter((field) => field.type === "select-multiple"),
    file: fields.filter((field) => field.type === "file"),
    fileMultiple: fields.filter((field) => field.type === "file-multiple"),
    json: fields.filter((field) => field.type === "json"),
  };

  const renderFieldLabel = (field: FieldDefinition) => {
    const fieldError = form.formState.errors[field.key];
    const isUniqueError = fieldError?.type === "unique";

    return (
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
    );
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
              ref: React.Ref<HTMLElement>;
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
                {renderFieldLabel(field)}
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
                {renderFieldLabel(field)}
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

    if (field.type === "json") {
      return (
        <FormJsonField key={field.key} field={field} control={form.control} />
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
                {renderFieldLabel(field)}
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
                    {renderFieldLabel(field)}
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
                {renderFieldLabel(field)}
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
                {renderFieldLabel(field)}
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

      case "autocomplete":
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => {
              const autocompleteOptions = getAutocompleteOptions(field);
              return (
                <FormItem>
                  {renderFieldLabel(field)}
                  <FormControl>
                    <AutocompleteInput
                      label=""
                      value={formField.value || ""}
                      onChange={(value) => {
                        formField.onChange(value);
                        form.trigger(field.key);
                      }}
                      options={autocompleteOptions}
                      placeholder={`Enter ${field.displayName.toLowerCase()}...`}
                      id={field.key}
                      showRecentOptions={false}
                      emptyMessage="Type to add new option"
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case "tags":
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                {renderFieldLabel(field)}
                <FormControl>
                  <TagInput
                    value={formField.value || ""}
                    onChange={(value) => {
                      formField.onChange(value);
                      form.trigger(field.key);
                    }}
                    generalData={[]}
                    generalDataTagField="tags"
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

      case "file":
        return (
          <FileUploadField
            key={field.key}
            control={form.control}
            name={field.key}
            label={field.displayName}
            description={field.description}
            required={!field.isOptional}
            unique={field.isUnique}
            acceptedTypes={field.acceptedFileTypes}
          />
        );
      case "file-multiple":
        return (
          <MultipleFileUploadField
            key={field.key}
            control={form.control}
            name={field.key}
            label={field.displayName}
            description={field.description}
            required={!field.isOptional}
            unique={field.isUnique}
            acceptedTypes={field.acceptedFileTypes}
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

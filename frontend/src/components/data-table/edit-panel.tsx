import { Loader2, Save, UndoDot, X } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { FieldDefinition } from "@/types/types";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";

export default function EditPanel({
  isSidebarOpen,
  selectedRecord,
  handleCloseSidebar,
  formRef,
  handleFormSubmit,
  fields,
  handleFormChange,
  hasUnsavedChanges,
  isSubmitting,
  handleResetForm,
}: {
  isSidebarOpen: boolean;
  selectedRecord: Record<string, any> | null;
  handleCloseSidebar: () => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  handleFormSubmit: (event: React.FormEvent) => void;
  fields: FieldDefinition[];
  handleFormChange: (formValues: Record<string, any>) => void;
  datasetId: string;
  dataKey: string;
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  handleResetForm: () => void;
}) {
  // State to store relation options
  const [relationOptions, setRelationOptions] = useState<
    Record<string, { id: string; label: string }[]>
  >({});
  const [loadingRelations, setIsLoadingRelations] = useState<
    Record<string, boolean>
  >({});

  // Populate relation options when component mounts or selected record changes
  useEffect(() => {
    if (!selectedRecord) return;

    // Find all relation fields that need options
    const relationFields = fields.filter(
      (field) => field.isRelation && field.relatedDataset
    );

    if (relationFields.length === 0) return;

    // Load options for each relation field
    relationFields.forEach((field) => {
      loadRelationOptions(field);
    });
  }, [selectedRecord, fields]);

  // Function to load options for a relation field
  const loadRelationOptions = async (field: FieldDefinition) => {
    if (!field.relatedDataset) return;

    // Set loading state for this field
    setIsLoadingRelations((prev) => ({ ...prev, [field.key]: true }));

    try {
      const records = await ApiService.getRecords(field.relatedDataset);

      // Transform records to options with id and label
      const options = generateOptionsForLoadRelationOptions(records, field);

      // Update options for this field
      setRelationOptions((prev) => ({ ...prev, [field.key]: options }));
    } catch (error) {
      console.error(
        `Error loading relation options for ${field.relatedDataset}:`,
        error
      );
    } finally {
      // Clear loading state
      setIsLoadingRelations((prev) => ({ ...prev, [field.key]: false }));
    }
  };

  // Get the display value for a relation field
  const getRelationDisplayValue = (
    field: FieldDefinition,
    value: string
  ): string => {
    if (!field.relatedDataset || !value) return "Select...";

    const options = relationOptions[field.key] || [];
    const option = options.find((opt) => opt.id === value);

    return option ? option.label : `ID: ${value}`;
  };

  // Function to render a field based on its type
  const renderField = (field: FieldDefinition) => {
    if (!selectedRecord) return null;

    const value = selectedRecord[field.key];

    // Handle relation fields
    if (field.isRelation && field.relatedDataset) {
      const isLoading = loadingRelations[field.key] || false;
      const options = relationOptions[field.key] || [];

      // Look for related data in the record
      const relatedDataKey = `${field.key}_data`;
      const relatedData = selectedRecord[relatedDataKey];

      // Get the current display label
      let currentLabel = "";
      if (relatedData) {
        if (field.displayField && relatedData[field.displayField]) {
          currentLabel = relatedData[field.displayField];
          if (
            field.secondaryDisplayField &&
            relatedData[field.secondaryDisplayField]
          ) {
            currentLabel += ` - ${relatedData[field.secondaryDisplayField]}`;
          }
        } else {
          currentLabel =
            relatedData.name || relatedData.title || `ID: ${value}`;
        }
      } else {
        currentLabel = value ? `ID: ${value}` : "None selected";
      }

      return (
        <div className="space-y-2 mb-4" key={field.key}>
          <label className="text-sm font-medium" htmlFor={field.key}>
            {field.displayName}
          </label>

          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}

          <Select
            name={field.key}
            defaultValue={value}
            onValueChange={(newValue) => {
              // Update the form data with the ID value
              if (formRef.current) {
                const formData = new FormData(formRef.current);
                const formValues: Record<string, any> = {};

                fields.forEach((f) => {
                  const fieldValue =
                    f.key === field.key ? newValue : formData.get(f.key);

                  formValues[f.key] = fieldValue;
                });

                // Call handleFormChange to trigger updates
                handleFormChange(formValues);
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading..."
                    : getRelationDisplayValue(field, value)
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading options...</span>
                </div>
              ) : options.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Current selection display */}
          {value && (
            <p className="text-xs text-muted-foreground mt-1">
              Current: {currentLabel}
            </p>
          )}
        </div>
      );
    }

    // Handle regular fields based on type
    switch (field.type) {
      case "date":
        return (
          <div className="space-y-2 mb-4" key={field.key}>
            <label className="text-sm font-medium" htmlFor={field.key}>
              {field.displayName}
            </label>

            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground"
                  )}
                  name={field.key}
                  type="button"
                >
                  {value ? (
                    format(new Date(value), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    // Update the form data
                    if (formRef.current) {
                      const formData = new FormData(formRef.current);
                      const formValues: Record<string, any> = {};

                      fields.forEach((f) => {
                        const fieldValue =
                          f.key === field.key ? date : formData.get(f.key);

                        formValues[f.key] = fieldValue;
                      });

                      // Call handleFormChange to trigger updates
                      handleFormChange(formValues);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "boolean":
        return (
          <div
            className="flex items-start space-x-3 space-y-0 rounded-md border p-4 mb-4"
            key={field.key}
          >
            <Checkbox
              id={field.key}
              name={field.key}
              checked={!!value}
              onCheckedChange={(checked) => {
                // Update the form data
                if (formRef.current) {
                  const formData = new FormData(formRef.current);
                  const formValues: Record<string, any> = {};

                  fields.forEach((f) => {
                    const fieldValue =
                      f.key === field.key ? checked : formData.get(f.key);

                    formValues[f.key] = fieldValue;
                  });

                  // Call handleFormChange to trigger updates
                  handleFormChange(formValues);
                }
              }}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor={field.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.displayName}
              </label>
              {field.description && (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              )}
            </div>
          </div>
        );

      case "number":
      case "percentage":
        return (
          <div className="space-y-2 mb-4" key={field.key}>
            <label className="text-sm font-medium" htmlFor={field.key}>
              {field.displayName}
              {field.unit && (
                <span className="ml-1 text-muted-foreground">
                  ({field.unit})
                </span>
              )}
            </label>

            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}

            <Input
              type="number"
              id={field.key}
              name={field.key}
              value={value ?? ""}
              onChange={(e) => {
                const newValue =
                  e.target.value === "" ? 0 : parseFloat(e.target.value);

                // Update the form data
                if (formRef.current) {
                  const formData = new FormData(formRef.current);
                  const formValues: Record<string, any> = {};

                  fields.forEach((f) => {
                    const fieldValue =
                      f.key === field.key ? newValue : formData.get(f.key);

                    formValues[f.key] = fieldValue;
                  });

                  // Call handleFormChange to trigger updates
                  handleFormChange(formValues);
                }
              }}
              step="any"
              min={0}
              max={field.type === "percentage" ? 100 : undefined}
            />
          </div>
        );

      case "text":
      default:
        return (
          <div className="space-y-2 mb-4" key={field.key}>
            <label className="text-sm font-medium" htmlFor={field.key}>
              {field.displayName}
            </label>

            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}

            <Input
              type="text"
              id={field.key}
              name={field.key}
              value={value ?? ""}
              onChange={(e) => {
                const newValue = e.target.value;

                // Update the form data
                if (formRef.current) {
                  const formData = new FormData(formRef.current);
                  const formValues: Record<string, any> = {};

                  fields.forEach((f) => {
                    const fieldValue =
                      f.key === field.key ? newValue : formData.get(f.key);

                    formValues[f.key] = fieldValue;
                  });

                  // Call handleFormChange to trigger updates
                  handleFormChange(formValues);
                }
              }}
            />
          </div>
        );
    }
  };

  return (
    isSidebarOpen &&
    selectedRecord && (
      <div className="md:w-[450px] md:h-[800px] flex-shrink-0 bg-background border rounded-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Record</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCloseSidebar()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          className="flex flex-col h-full"
        >
          <ScrollArea className="flex-1 p-4">
            {selectedRecord && fields.map(renderField)}
          </ScrollArea>

          {/* Fixed footer with update button */}
          <div className="p-4 border-t mt-auto space-y-3">
            {hasUnsavedChanges && (
              <div className="flex items-center justify-center w-full py-1 px-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !hasUnsavedChanges}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                disabled={!hasUnsavedChanges}
              >
                <UndoDot className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    )
  );
}

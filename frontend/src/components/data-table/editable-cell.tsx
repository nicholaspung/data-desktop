import { FieldDefinition } from "@/types/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ApiService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditableCellConfirmButtons from "./editable-cell-confirm-buttons";
import dataStore, { DataStoreName, updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { getDisplayValue } from "@/lib/table-utils";
import ReusableSelect from "../reusable/reusable-select";
import ReusableMultiSelect from "../reusable/reusable-multiselect";
import FileUpload from "../reusable/file-upload";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MultipleFileUpload from "../reusable/multiple-file-upload";
import { JsonEditCell } from "./json-edit-cell";
import AutocompleteInput from "../reusable/autocomplete-input";

const EditableCell = ({
  value: initialValue,
  row,
  column,
  field,
  width,
  onDataChange,
  datasetId,
}: {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  width?: string;
  datasetId: DataStoreName;
  onDataChange?: () => void;
}) => {
  const allData = useStore(dataStore, (state) => state);

  const getAutocompleteOptions = (field: FieldDefinition) => {
    if (field.type !== "autocomplete") return [];

    const storeData = allData[datasetId] || [];

    if (field.secondaryDisplayField) {
      const groupedValues = new Map<string, Set<string>>();

      storeData.forEach((record: any) => {
        const primaryValue = record[field.key];
        const secondaryValue = record[field.secondaryDisplayField!];

        if (
          primaryValue &&
          typeof primaryValue === "string" &&
          primaryValue.trim() !== ""
        ) {
          if (!groupedValues.has(primaryValue)) {
            groupedValues.set(primaryValue, new Set());
          }
          if (
            secondaryValue &&
            typeof secondaryValue === "string" &&
            secondaryValue.trim() !== ""
          ) {
            groupedValues.get(primaryValue)!.add(secondaryValue);
          }
        }
      });

      return Array.from(groupedValues.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([primaryValue, secondaryValues]) => ({
          id: primaryValue,
          label: primaryValue,
          secondaryValue: Array.from(secondaryValues).join(", "),
        }));
    }

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

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInteractingWithPopover, setIsInteractingWithPopover] =
    useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const originalValue = initialValue;
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (isInteractingWithPopover) {
        return;
      }

      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        const isPopoverContent = !!document
          .querySelector(".popover-content")
          ?.contains(event.target as Node);
        const isSelectContent =
          !!document
            .querySelector('[role="listbox"]')
            ?.contains(event.target as Node) ||
          !!document
            .querySelector(".select-content")
            ?.contains(event.target as Node);
        const isDialog = !!document
          .querySelector('[role="dialog"]')
          ?.contains(event.target as Node);

        if (isPopoverContent || isSelectContent || isDialog) {
          return;
        }

        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, isInteractingWithPopover]);

  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  const handleEdit = () => {
    if (
      field.type === "file" ||
      field.type === "file-multiple" ||
      field.type === "json"
    ) {
      setShowDialog(true);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (
      (field.type !== "file" && editValue === initialValue) ||
      (field.type === "file" &&
        JSON.stringify(editValue) === JSON.stringify(initialValue))
    ) {
      setIsEditing(false);
      setShowDialog(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const recordId = row.original.id;
      if (!recordId) {
        throw new Error("Record ID not found");
      }

      const record = await ApiService.getRecord(recordId);
      if (!record) {
        throw new Error("Record not found");
      }

      const updatedRecord = {
        ...record,
        [field.key]: editValue,
      };

      const response = await ApiService.updateRecord(recordId, updatedRecord);
      if (response) {
        updateEntry(recordId, response, datasetId);
      }

      toast.success("Cell updated successfully");

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error updating cell:", error);
      toast.error("Failed to update cell");

      setEditValue(initialValue);
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
      setShowDialog(false);
    }
  };

  const handleCancel = () => {
    setEditValue(initialValue);
    setIsEditing(false);
    setShowDialog(false);
  };

  const handleValueChange = (newValue: any) => {
    setEditValue(newValue);
  };

  const getFormattedDisplayValue = (value: any) => {
    if (field.isRelation && field.relatedDataset) {
      const relatedDataKey = `${column.id}_data`;
      const relatedData = row.original[relatedDataKey];

      if (relatedData) {
        return getDisplayValue(field, relatedData);
      }

      return value ? `ID: ${value}` : "N/A";
    }

    switch (field.type) {
      case "date":
        return value instanceof Date
          ? format(new Date(value), "PP")
          : value
            ? format(new Date(value), "PP")
            : "N/A";
      case "boolean":
        return value ? "Yes" : "No";
      case "number":
        return typeof value === "number"
          ? `${value.toFixed(2)}${field.unit ? ` ${field.unit}` : ""}`
          : "0";
      case "percentage":
        return typeof value === "number"
          ? `${(value < 1 ? value * 100 : value).toFixed(2)}%`
          : "0%";
      case "select-multiple":
        if (!value || !Array.isArray(value) || value.length === 0) {
          return "—";
        }
        return value.join(", ");
      case "file":
        return value ? "Image available" : "No image";
      case "file-multiple":
        return value ? "Images available" : "No images";
      case "json":
        if (value === null || value === undefined) {
          return "—";
        }
        return `${JSON.stringify(value, null, 2).slice(0, 10)}...`;
      case "autocomplete":
      case "text":
      default:
        return value || "-";
    }
  };

  const cellStyle = {
    width: width || "auto",
    minWidth: "80px",
    maxWidth: "100%",
  };
  const cellClassName = "flex flex-row gap-1 align-center justify-center";

  const renderRelationEditMode = (
    options: {
      id: any;
      label: string;
    }[],
    noDefault: boolean
  ) => (
    <>
      <Select
        value={editValue?.toString() || ""}
        onValueChange={(value) => {
          handleValueChange(value);

          setIsInteractingWithPopover(true);
          setTimeout(() => setIsInteractingWithPopover(false), 100);
        }}
        disabled={isSubmitting}
        onOpenChange={(open) => {
          setIsInteractingWithPopover(open);
        }}
      >
        <SelectTrigger
          className="w-full h-8 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder={`Select ${field.displayName}`} />
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No options available
            </div>
          ) : (
            <>
              {noDefault ? null : (
                <SelectItem value="_none_">Select...</SelectItem>
              )}
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </>
  );

  const renderEditMode = () => {
    if (field.isRelation && field.relatedDataset) {
      const options = generateOptionsForLoadRelationOptions(
        allData[field.relatedDataset as DataStoreName],
        field
      );
      return renderRelationEditMode(options, field.isOptional ? false : true);
    }

    switch (field.type) {
      case "text":
        return (
          <Input
            value={editValue || ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="h-8 w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );
      case "number":
      case "percentage":
        return (
          <Input
            type="number"
            value={editValue ?? 0}
            onChange={(e) => {
              const val =
                e.target.value === "" ? 0 : parseFloat(e.target.value);
              handleValueChange(isNaN(val) ? 0 : val);
            }}
            className="h-8 w-full"
            step="any"
            min={0}
            max={field.type === "percentage" ? 100 : undefined}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );
      case "boolean":
        return (
          <div className="flex justify-center items-center w-full">
            <Checkbox
              checked={!!editValue}
              onCheckedChange={(checked) => handleValueChange(!!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      case "date":
        return (
          <Popover
            open={isEditing && isInteractingWithPopover}
            onOpenChange={(open) => {
              setIsInteractingWithPopover(open);

              if (!open) {
                setIsInteractingWithPopover(false);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start text-left font-normal"
                onClick={(e) => {
                  e.stopPropagation();

                  setIsInteractingWithPopover(true);
                }}
              >
                {editValue ? format(new Date(editValue), "PP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              onClick={(e) => e.stopPropagation()}
              sideOffset={5}
              align="start"
            >
              <div className="flex flex-col">
                <Calendar
                  mode="single"
                  selected={editValue ? new Date(editValue) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleValueChange(date);
                    }
                  }}
                  initialFocus
                  disabled={(date) =>
                    field.isOptional
                      ? false
                      : date > new Date() || date < new Date("1900-01-01")
                  }
                />
                <div className="flex justify-end gap-2 p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();

                      handleValueChange(initialValue);

                      setIsInteractingWithPopover(false);

                      const closeButton = document.querySelector(
                        "[data-radix-popover-close]"
                      );
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      } else {
                        const event = new KeyboardEvent("keydown", {
                          key: "Escape",
                        });
                        document.dispatchEvent(event);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();

                      setIsInteractingWithPopover(false);

                      const closeButton = document.querySelector(
                        "[data-radix-popover-close]"
                      );
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      } else {
                        const event = new KeyboardEvent("keydown", {
                          key: "Escape",
                        });
                        document.dispatchEvent(event);
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      case "select-single":
        return (
          <ReusableSelect
            noDefault={field.isOptional ? false : true}
            options={field.options || []}
            value={editValue as string}
            onChange={(value) => setEditValue(value)}
            title={column.id as string}
            triggerClassName="w-full"
          />
        );
      case "select-multiple":
        return (
          <ReusableMultiSelect
            options={field.options || []}
            selected={Array.isArray(editValue) ? editValue : []}
            onChange={(values) => setEditValue(values)}
            title={column.id as string}
            className="min-w-[30rem]"
          />
        );
      case "autocomplete": {
        const autocompleteOptions = getAutocompleteOptions(field);
        return (
          <AutocompleteInput
            value={editValue || ""}
            onChange={(value) => handleValueChange(value)}
            options={autocompleteOptions}
            placeholder={`Enter ${field.displayName || field.key}...`}
            showRecentOptions={false}
            emptyMessage="Type to add new option"
            className="min-w-[200px]"
            inputClassName="h-8"
            renderItem={
              field.secondaryDisplayField
                ? (option) => (
                    <div className="flex flex-row items-center gap-2">
                      <span>{option.label}</span>
                      {option.secondaryValue && (
                        <span className="text-xs text-muted-foreground">
                          {option.secondaryValue}
                        </span>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        );
      }
      case "file":
        return null;
      case "file-multiple":
        return null;
      case "json":
        return null;
      default:
        return <span>{initialValue}</span>;
    }
  };

  const renderDisplayMode = () => {
    if (field.type === "file") {
      return (
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors",
            "flex items-center justify-center",
            "min-h-[30px]"
          )}
          style={cellStyle}
          onClick={handleEdit}
        >
          {initialValue ? (
            <div className="w-8 h-8 overflow-hidden rounded-sm">
              <img
                src={initialValue}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              No file
            </span>
          )}
        </div>
      );
    }

    if (field.type === "file-multiple") {
      return (
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors",
            "flex items-center justify-center",
            "min-h-[30px]"
          )}
          style={cellStyle}
          onClick={handleEdit}
        >
          {Array.isArray(initialValue) && initialValue.length > 0 ? (
            <div className="w-8 h-8 overflow-hidden rounded-sm relative">
              {initialValue[0].src ? (
                <>
                  <img
                    src={initialValue[0].src}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  {initialValue.length > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl-sm">
                      {initialValue.length}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Invalid file format
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              No files
            </span>
          )}
        </div>
      );
    }

    const formattedValue = getFormattedDisplayValue(initialValue);

    return (
      <div
        className={cn(
          "truncate cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors",
          "flex items-center justify-between",
          "min-h-[30px]"
        )}
        style={cellStyle}
        onClick={handleEdit}
        title={
          typeof formattedValue === "string" && formattedValue
            ? formattedValue
            : "Click to edit"
        }
      >
        <span className="truncate w-full min-h-[24px]">
          {formattedValue || (
            <span className="text-muted-foreground italic text-xs">
              Empty - click to edit
            </span>
          )}
        </span>
      </div>
    );
  };

  const OriginalValueLabel = () => (
    <div
      className="text-xs text-muted-foreground mb-1 truncate"
      title={getFormattedDisplayValue(originalValue)}
    >
      Original: {getFormattedDisplayValue(originalValue)}
    </div>
  );

  return (
    <div ref={cellRef}>
      {isEditing && field.type === "file" && showDialog ? (
        <Dialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleCancel();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[600px] overflow-y-auto">
            <DialogTitle>
              {initialValue ? "Update Image" : "Upload Image"}
            </DialogTitle>
            <div className="py-4">
              <FileUpload
                value={editValue || null}
                onChange={(value) => handleValueChange(value)}
                maxSize={20}
              />
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : isEditing && field.type === "file-multiple" && showDialog ? (
        <Dialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleCancel();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[600px] overflow-y-auto">
            <DialogTitle>
              {initialValue && initialValue.length > 0
                ? "Update Images"
                : "Upload Images"}
            </DialogTitle>
            <div className="py-4">
              <MultipleFileUpload
                value={editValue || []}
                onChange={(value) => handleValueChange(value)}
                maxSize={20}
              />
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : isEditing && field.type === "json" && showDialog ? (
        <Dialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleCancel();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[600px] overflow-y-auto">
            <DialogTitle>Update JSON</DialogTitle>
            <div className="py-4">
              <JsonEditCell
                value={editValue || {}}
                onChange={(value) => {
                  handleValueChange(value);
                  handleSave();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : isEditing && field.type !== "file" ? (
        <div style={cellStyle} className="flex flex-col gap-1">
          <OriginalValueLabel />
          <div className={cellClassName}>
            {renderEditMode()}
            <EditableCellConfirmButtons
              handleSave={handleSave}
              handleCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      ) : (
        renderDisplayMode()
      )}
    </div>
  );
};

export default EditableCell;

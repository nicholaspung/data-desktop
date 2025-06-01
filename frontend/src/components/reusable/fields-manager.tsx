import { Plus, PlusCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import ReusableSelect from "./reusable-select";
import ReusableCard from "./reusable-card";
import { DynamicField, SimpleFieldType } from "@/types/types";
import { Switch } from "../ui/switch";
import { useState } from "react";
import { Separator } from "../ui/separator";

const FIELD_TYPE_OPTIONS = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "date", label: "Date" },
  { id: "select-single", label: "Select" },
  { id: "select-multiple", label: "Multi-select" },
  { id: "boolean", label: "Boolean" },
];

export default function FieldsManager({
  onUpdate,
  initialFields,
  requiredLabel,
}: {
  onUpdate: (fields: DynamicField[]) => void;
  initialFields?: DynamicField[];
  requiredLabel?: string;
}) {
  const [fields, setFields] = useState<DynamicField[]>(
    initialFields ? initialFields : []
  );
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {}
  );

  const addField = () => {
    const newField: DynamicField = {
      id: crypto.randomUUID(),
      name: "",
      type: "text",
      required: false,
      options: [],
    };

    setFields((prev) => [...prev, newField]);
    onUpdate([...fields, newField]);
    setExpandedFields((prev) => ({ ...prev, [newField.id]: false }));
  };

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((field) => field.id !== fieldId));
    onUpdate(fields.filter((field) => field.id !== fieldId));
    setExpandedFields((prev) => {
      const newState = { ...prev };
      delete newState[fieldId];
      return newState;
    });
  };

  const updateField = (fieldId: string, updates: Partial<DynamicField>) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
    onUpdate(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const addFieldOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId) {
          const options = field.options || [];
          return {
            ...field,
            options: [...options, { value: crypto.randomUUID(), label: "" }],
          };
        }
        return field;
      })
    );
  };

  const updateFieldOption = (
    fieldId: string,
    optionIndex: number,
    label: string
  ) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId && field.options) {
          const updatedOptions = [...field.options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            label,
          };
          return { ...field, options: updatedOptions };
        }
        return field;
      })
    );
  };

  const removeFieldOption = (fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId && field.options) {
          const updatedOptions = [...field.options];
          updatedOptions.splice(optionIndex, 1);
          return { ...field, options: updatedOptions };
        }
        return field;
      })
    );
  };

  const toggleFieldExpansion = (fieldId: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Fields</h3>
        <Button type="button" onClick={addField} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {fields.map((field) => (
        <ReusableCard
          key={field.id}
          showHeader={false}
          contentClassName="pt-6 space-y-4"
          content={
            <>
              <div className="flex items-center gap-4">
                <div className="w-1/3">
                  <ReusableSelect
                    options={FIELD_TYPE_OPTIONS}
                    value={field.type}
                    onChange={(value) =>
                      updateField(field.id, { type: value as SimpleFieldType })
                    }
                    placeholder="Type"
                    title="field type"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      updateField(field.id, { name: e.target.value })
                    }
                    placeholder="Enter field name"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`field-required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(field.id, { required: checked })
                    }
                  />
                  <Label
                    htmlFor={`field-required-${field.id}`}
                    className="cursor-pointer"
                  >
                    {requiredLabel || "Required"}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFieldExpansion(field.id)}
                >
                  {expandedFields[field.id] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {(field.type === "select-single" ||
                field.type === "select-multiple") && (
                <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFieldOption(field.id)}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  {field.options && field.options.length > 0 ? (
                    <div className="space-y-2 grid gap-4 grid-cols-4">
                      {field.options.map((option, index) => (
                        <div
                          key={option.value || index}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              updateFieldOption(field.id, index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFieldOption(field.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No options added yet. Add at least one option.
                    </div>
                  )}
                </div>
              )}

              {expandedFields[field.id] && (
                <>
                  <Separator />

                  <div>
                    <Label htmlFor={`field-description-${field.id}`}>
                      Description (Optional)
                    </Label>
                    <Input
                      id={`field-description-${field.id}`}
                      value={field.description || ""}
                      onChange={(e) =>
                        updateField(field.id, { description: e.target.value })
                      }
                      placeholder="Enter field description"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`field-placeholder-${field.id}`}>
                      Placeholder (Optional)
                    </Label>
                    <Input
                      id={`field-placeholder-${field.id}`}
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                      placeholder="Enter field placeholder"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </>
          }
        />
      ))}
    </div>
  );
}

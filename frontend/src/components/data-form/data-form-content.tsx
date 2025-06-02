import { Loader2, UndoDot, X } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmResetDialog } from "../reusable/confirm-reset-dialog";
import { FieldDefinition } from "@/types/types";

export default function DataFormContent({
  fieldsByType,
  hideSubmitButton,
  isSubmitting,
  submitLabel,
  mode,
  handleClearForm,
  handleCancel,
  onCancel,
  renderField,
}: {
  fieldsByType: {
    date: FieldDefinition[];
    boolean: FieldDefinition[];
    numeric: FieldDefinition[];
    text: FieldDefinition[];
    tags: FieldDefinition[];
    selectSingle: FieldDefinition[];
    selectMultiple: FieldDefinition[];
    markdown: FieldDefinition[];
    file: FieldDefinition[];
    fileMultiple: FieldDefinition[];
    json: FieldDefinition[];
  };
  hideSubmitButton: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  mode: string;
  handleClearForm: () => void;
  handleCancel: () => void;
  onCancel?: () => void;
  renderField: (field: FieldDefinition) => React.ReactNode;
}) {
  return (
    <>
      {/* Date fields */}
      {fieldsByType.date.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {fieldsByType.date.map(renderField)}
        </div>
      )}

      {/* Boolean fields */}
      {fieldsByType.boolean.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {fieldsByType.boolean.map(renderField)}
        </div>
      )}

      {/* Numeric and text fields in a grid */}
      {(fieldsByType.numeric.length > 0 ||
        fieldsByType.text.length > 0 ||
        fieldsByType.tags.length > 0 ||
        fieldsByType.markdown.length > 0 ||
        fieldsByType.selectSingle.length > 0 ||
        fieldsByType.selectMultiple.length > 0 ||
        fieldsByType.json.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {fieldsByType.numeric.map(renderField)}
          {fieldsByType.text.map(renderField)}
          {fieldsByType.tags.map(renderField)}
          {fieldsByType.markdown.map(renderField)}
          {fieldsByType.selectSingle.map(renderField)}
          {fieldsByType.selectMultiple.map(renderField)}
          {fieldsByType.json.map(renderField)}
        </div>
      )}


      {/* File and File-multiple fields */}
      {(fieldsByType.file.length > 0 ||
        fieldsByType.fileMultiple.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {fieldsByType.file.map(renderField)}
          {fieldsByType.fileMultiple.map(renderField)}
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
    </>
  );
}

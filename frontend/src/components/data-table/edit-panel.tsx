import { Loader2, Save, UndoDot, X } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import DataForm from "../data-form/data-form";
import { FieldDefinition } from "@/types";

export default function EditPanel({
  isSidebarOpen,
  selectedRecord,
  handleCloseSidebar,
  formRef,
  handleFormSubmit,
  fields,
  handleFormChange,
  datasetId,
  dataKey,
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
          onChange={() => {
            // Capture form values and save to local storage
            if (formRef.current) {
              const formData = new FormData(formRef.current);
              const formValues: Record<string, any> = {};

              fields.forEach((field) => {
                const value = formData.get(field.key);
                formValues[field.key] = value;
              });

              handleFormChange(formValues);
            }
          }}
        >
          <ScrollArea className="flex-1 p-4">
            {selectedRecord && (
              <DataForm
                datasetId={datasetId}
                fields={fields}
                initialValues={selectedRecord}
                mode="edit"
                recordId={selectedRecord[dataKey]}
                // Pass a custom handler to avoid default submission
                onSuccess={() => {}}
                hideSubmitButton={true}
              />
            )}
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

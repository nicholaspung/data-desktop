import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import ReusableSelect from "@/components/reusable/reusable-select";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import dataStore, { DataStoreName, deleteEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { format } from "date-fns";

export default function BloodResultsManager() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [selectedResult, setSelectedResult] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bloodResultFields = getDatasetFields("blood_results");

  const results = useStore(dataStore, (state) => state.blood_results);
  const markers = useStore(dataStore, (state) => state.blood_markers);
  const tests = useStore(dataStore, (state) => state.bloodwork);

  const resultOptions = results
    .map((result) => {
      const test =
        result.blood_test_id_data ||
        tests.find((t) => t.id === result.blood_test_id);
      const marker =
        result.blood_marker_id_data ||
        markers.find((m) => m.id === result.blood_marker_id);

      const testDate = test?.date
        ? format(new Date(test.date), "MMM d, yyyy")
        : "Unknown date";

      const markerName = marker?.name || "Unknown marker";

      const value =
        result.value_text && result.value_text.trim() !== ""
          ? result.value_text
          : result.value_number;

      return {
        id: result.id,
        label: `${testDate} - ${markerName}: ${value}`,
        testDate: test?.date ? new Date(test.date) : new Date(0),
        markerName,
      };
    })
    .sort((a, b) => {
      const dateCompare = b.testDate.getTime() - a.testDate.getTime();
      if (dateCompare !== 0) return dateCompare;

      return a.markerName.localeCompare(b.markerName);
    });

  const selectedResultData = results.find(
    (result) => result.id === selectedResult
  );

  const handleAddSuccess = () => {
    toast.success("Blood result added successfully!");
  };

  const handleEditSuccess = () => {
    setSelectedResult("");
    toast.success("Blood result updated successfully!");
  };

  const handleDelete = async () => {
    if (!selectedResult) return;

    setIsDeleting(true);

    try {
      await ApiService.deleteRecord(selectedResult);
      deleteEntry(selectedResult, "blood_results" as DataStoreName);
      toast.success("Blood result deleted successfully!");
      setSelectedResult("");
    } catch (error) {
      console.error("Error deleting blood result:", error);
      toast.error("Failed to delete blood result");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedResult("");
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Blood Result Manager"
      description="Add new blood results or update existing ones."
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Manage Blood Results
        </Button>
      }
      customContent={
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <ReusableTabs
            tabs={[
              {
                id: "add",
                label: (
                  <div className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add New Result
                  </div>
                ),
                content: (
                  <div className="pt-2">
                    {tests.length === 0 || markers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {tests.length === 0 && markers.length === 0
                          ? "You need to add both blood tests and markers before you can add results."
                          : tests.length === 0
                            ? "You need to add a blood test before you can add results."
                            : "You need to add blood markers before you can add results."}
                      </div>
                    ) : (
                      <DataForm
                        datasetId="blood_results"
                        fields={bloodResultFields}
                        onSuccess={handleAddSuccess}
                        submitLabel="Add Blood Result"
                        mode="add"
                        title="Add New Blood Result"
                      />
                    )}
                  </div>
                ),
              },
              {
                id: "edit",
                label: (
                  <div className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit Result
                  </div>
                ),
                content: (
                  <div className="pt-2">
                    {results.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No blood results available to edit. Please add a result
                        first.
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <h3 className="text-sm font-medium mb-2">
                            Select Blood Result to Edit:
                          </h3>
                          <ReusableSelect
                            options={resultOptions}
                            value={selectedResult}
                            onChange={setSelectedResult}
                            title="Blood Result"
                            placeholder="Select a blood result..."
                          />
                          {selectedResult && (
                            <div className="mt-3">
                              <ConfirmDeleteDialog
                                title="Delete Blood Result"
                                description="Are you sure you want to delete this blood result? This action cannot be undone."
                                onConfirm={handleDelete}
                                loading={isDeleting}
                                triggerText="Delete Selected Result"
                                variant="destructive"
                                size="default"
                              />
                            </div>
                          )}
                        </div>
                        {selectedResult && selectedResultData ? (
                          <DataForm
                            datasetId="blood_results"
                            fields={bloodResultFields}
                            initialValues={selectedResultData}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setSelectedResult("")}
                            submitLabel="Update Blood Result"
                            mode="edit"
                            recordId={selectedResult}
                          />
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            Select a result to edit its details
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            defaultTabId={activeTab}
            onChange={setActiveTab}
            className="w-full"
            tabsListClassName="grid w-full grid-cols-2 mb-4"
            tabsContentClassName="mt-0"
          />
        </div>
      }
      customFooter={<div />}
    />
  );
}

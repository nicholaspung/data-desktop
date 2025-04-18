// src/features/bloodwork/bloodwork-manager.tsx
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
import { BloodworkTest } from "@/store/bloodwork-definitions";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function BloodworkManager() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkFields = getDatasetFields("bloodwork");

  const tests = useStore(
    dataStore,
    (state) => state.bloodwork as BloodworkTest[]
  );

  // Create options for the selection dropdown, sorted by date (newest first)
  const testOptions = tests
    .map((test) => ({
      id: test.id,
      label: format(new Date(test.date), "MMM d, yyyy"),
      date: new Date(test.date),
      lab: test.lab_name ? ` - ${test.lab_name}` : "",
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort newest to oldest
    .map((test) => ({
      id: test.id,
      label: `${format(test.date, "MMM d, yyyy")}${test.lab}`,
    }));

  // Get the selected test data
  const selectedTestData = tests.find((test) => test.id === selectedTest);

  const handleAddSuccess = () => {
    toast.success("Bloodwork test added successfully!");
  };

  const handleEditSuccess = () => {
    setSelectedTest("");
    toast.success("Bloodwork test updated successfully!");
  };

  const handleDelete = async () => {
    if (!selectedTest) return;

    setIsDeleting(true);

    try {
      await ApiService.deleteRecord(selectedTest);
      deleteEntry(selectedTest, "bloodwork" as DataStoreName);
      toast.success("Bloodwork test deleted successfully!");
      setSelectedTest("");
    } catch (error) {
      console.error("Error deleting bloodwork test:", error);
      toast.error("Failed to delete bloodwork test");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedTest("");
      // Reset to add tab when closing
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Bloodwork Manager"
      description="Add new bloodwork tests or update existing ones."
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Manage Bloodwork Tests
        </Button>
      }
      customContent={
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="add" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add New Test
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex items-center gap-1"
                disabled={tests.length === 0}
              >
                <Edit className="h-4 w-4" />
                Edit Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="pt-2">
              <DataForm
                datasetId="bloodwork"
                fields={bloodworkFields}
                onSuccess={handleAddSuccess}
                submitLabel="Add Bloodwork Test"
                mode="add"
                title="Add New Bloodwork Test"
              />
            </TabsContent>

            <TabsContent value="edit" className="pt-2">
              {tests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No bloodwork tests available to edit. Please add a test first.
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">
                      Select Bloodwork Test to Edit:
                    </h3>
                    <ReusableSelect
                      options={testOptions}
                      value={selectedTest}
                      onChange={setSelectedTest}
                      title="Bloodwork Test"
                      placeholder="Select a bloodwork test..."
                    />

                    {/* Delete button appears when a test is selected */}
                    {selectedTest && (
                      <div className="mt-3">
                        <ConfirmDeleteDialog
                          title="Delete Bloodwork Test"
                          description="Are you sure you want to delete this bloodwork test? This will also delete all results associated with this test. This action cannot be undone."
                          onConfirm={handleDelete}
                          loading={isDeleting}
                          triggerText="Delete Selected Test"
                          variant="destructive"
                          size="default"
                        />
                      </div>
                    )}
                  </div>

                  {selectedTest && selectedTestData ? (
                    <DataForm
                      datasetId="bloodwork"
                      fields={bloodworkFields}
                      initialValues={selectedTestData}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setSelectedTest("")}
                      submitLabel="Update Bloodwork Test"
                      mode="edit"
                      recordId={selectedTest}
                    />
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Select a test to edit its details
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      }
      customFooter={<div />} // Empty div to remove default footer
    />
  );
}

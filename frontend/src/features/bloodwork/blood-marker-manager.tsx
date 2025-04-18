// src/features/bloodwork/blood-marker-manager.tsx
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
import { BloodMarker } from "./bloodwork";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BloodMarkerManager() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [selectedMarker, setSelectedMarker] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bloodMarkerFields = getDatasetFields("blood_markers");

  const markers = useStore(
    dataStore,
    (state) => state.blood_markers as BloodMarker[]
  );

  // Create options for the selection dropdown, sorted alphabetically by name
  const markerOptions = markers
    .map((marker) => ({
      id: marker.id,
      label: marker.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

  // Get the selected marker data
  const selectedMarkerData = markers.find(
    (marker) => marker.id === selectedMarker
  );

  const handleAddSuccess = () => {
    toast.success("Blood marker added successfully!");
  };

  const handleEditSuccess = () => {
    setSelectedMarker("");
    toast.success("Blood marker updated successfully!");
  };

  const handleDelete = async () => {
    if (!selectedMarker) return;

    setIsDeleting(true);

    try {
      await ApiService.deleteRecord(selectedMarker);
      deleteEntry(selectedMarker, "blood_markers" as DataStoreName);
      toast.success("Blood marker deleted successfully!");
      setSelectedMarker("");
    } catch (error) {
      console.error("Error deleting blood marker:", error);
      toast.error("Failed to delete blood marker");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedMarker("");
      // Reset to add tab when closing
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Blood Marker Manager"
      description="Add new blood markers or update existing ones."
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Manage Blood Markers
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
                Add New Marker
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex items-center gap-1"
                disabled={markers.length === 0}
              >
                <Edit className="h-4 w-4" />
                Edit Marker
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="pt-2">
              <DataForm
                datasetId="blood_markers"
                fields={bloodMarkerFields}
                onSuccess={handleAddSuccess}
                submitLabel="Add Blood Marker"
                mode="add"
                title="Add New Blood Marker"
              />
            </TabsContent>

            <TabsContent value="edit" className="pt-2">
              {markers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No blood markers available to edit. Please add a marker first.
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">
                      Select Blood Marker to Edit:
                    </h3>
                    <ReusableSelect
                      options={markerOptions}
                      value={selectedMarker}
                      onChange={setSelectedMarker}
                      title="Blood Marker"
                      placeholder="Select a blood marker..."
                    />

                    {/* Delete button appears when a marker is selected */}
                    {selectedMarker && (
                      <div className="mt-3">
                        <ConfirmDeleteDialog
                          title="Delete Blood Marker"
                          description="Are you sure you want to delete this blood marker? This will also delete all results associated with this marker. This action cannot be undone."
                          onConfirm={handleDelete}
                          loading={isDeleting}
                          triggerText="Delete Selected Marker"
                          variant="destructive"
                          size="default"
                        />
                      </div>
                    )}
                  </div>

                  {selectedMarker && selectedMarkerData ? (
                    <DataForm
                      datasetId="blood_markers"
                      fields={bloodMarkerFields}
                      initialValues={selectedMarkerData}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setSelectedMarker("")}
                      submitLabel="Update Blood Marker"
                      mode="edit"
                      recordId={selectedMarker}
                    />
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Select a marker to edit its details
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

import { useState, useRef } from "react";
import { Plus, Edit } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import DataForm from "@/components/data-form/data-form";
import ReusableSelect from "@/components/reusable/reusable-select";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import dataStore, { DataStoreName, deleteEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import AddBloodMarkerForm, { AddBloodMarkerFormRef } from "./add-blood-marker-form";

interface BloodMarkerManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BloodMarkerManager({ open, onOpenChange }: BloodMarkerManagerProps) {
  const [activeTab, setActiveTab] = useState("add");
  const [selectedMarker, setSelectedMarker] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bloodMarkerFields = getDatasetFields("blood_markers");
  const addFormRef = useRef<AddBloodMarkerFormRef>(null);

  const markers = useStore(dataStore, (state) => state.blood_markers);

  const categories = Array.from(
    new Set(
      markers
        .map((marker) => marker.category)
        .filter((category) => category && category.trim() !== "")
    )
  ).sort();

  const hasUncategorizedMarkers = markers.some(
    (marker) => !marker.category || marker.category.trim() === ""
  );
  if (hasUncategorizedMarkers) {
    categories.push("Uncategorized");
  }

  const filteredMarkers = selectedCategory
    ? markers.filter((marker) => {
        if (selectedCategory === "Uncategorized") {
          return !marker.category || marker.category.trim() === "";
        }
        return marker.category === selectedCategory;
      })
    : markers;

  const markerOptions = filteredMarkers
    .map((marker) => ({
      id: marker.id,
      label: marker.name,
      unit: marker.unit || "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const selectedMarkerData = markers.find(
    (marker) => marker.id === selectedMarker
  );

  const handleAddSuccess = () => {
    // Success message is handled by the form component
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
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedMarker("");
      setSelectedCategory("");
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Blood Marker Manager"
      description="Add new blood markers or update existing ones."
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={false}
      contentClassName="sm:max-w-[800px]"
      confirmText={activeTab === "add" ? "Add Blood Marker" : undefined}
      onConfirm={activeTab === "add" ? () => addFormRef.current?.submit() : undefined}
      loading={activeTab === "add" ? addFormRef.current?.isSubmitting : false}
      fixedFooter={activeTab === "add"}
      customContent={
        <div className="space-y-4">
          <ReusableTabs
            tabs={[
              {
                id: "add",
                label: (
                  <div className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add New Marker
                  </div>
                ),
                content: (
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-3">
                    <AddBloodMarkerForm
                      ref={addFormRef}
                      onSuccess={handleAddSuccess}
                    />
                  </div>
                ),
              },
              {
                id: "edit",
                label: (
                  <div className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit Marker
                  </div>
                ),
                content: (
                  <div className="max-h-[60vh] overflow-y-auto pr-3">
                    {markers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No blood markers available to edit. Please add a marker
                        first.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          {categories.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium mb-2">
                                Filter by Category:
                              </h3>
                              <ReusableSelect
                                options={categories.map((category) => ({
                                  id: category,
                                  label: category,
                                }))}
                                value={selectedCategory}
                                onChange={(value) => {
                                  setSelectedCategory(value);
                                  setSelectedMarker("");
                                }}
                                title="Category"
                                placeholder="Search or select category..."
                                searchSelect={true}
                                usePortal={true}
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-medium mb-2">
                              Select Blood Marker to Edit:
                            </h3>
                            <ReusableSelect
                              options={markerOptions}
                              value={selectedMarker}
                              onChange={setSelectedMarker}
                              title="Blood Marker"
                              placeholder="Search blood markers..."
                              searchSelect={true}
                              usePortal={true}
                              renderItem={(option) => (
                                <div className="flex flex-row items-center gap-2">
                                  <span>{option.label}</span>
                                  {option.unit && (
                                    <span className="text-xs text-muted-foreground">
                                      {option.unit}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                          {selectedMarker && (
                            <div>
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
                            initialValues={
                              selectedMarkerData as unknown as Record<
                                string,
                                unknown
                              >
                            }
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
                      </div>
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
    />
  );
}

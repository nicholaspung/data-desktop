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
import { format } from "date-fns";
import ReusableTabs from "@/components/reusable/reusable-tabs";

export default function BodyMeasurementManager() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bodyMeasurementFields = getDatasetFields("body_measurements");

  const measurements = useStore(dataStore, (state) => state.body_measurements);

  const measurementOptions = measurements
    .map((measurement) => ({
      id: measurement.id,
      label: format(new Date(measurement.date), "MMM d, yyyy"),
      date: new Date(measurement.date),
      measurement: measurement.measurement ? ` - ${measurement.measurement}` : "",
      value: measurement.value ? ` (${measurement.value} ${measurement.unit || ""})` : "",
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((measurement) => ({
      id: measurement.id,
      label: `${format(measurement.date, "MMM d, yyyy")}${measurement.measurement}${measurement.value}`,
    }));

  const selectedMeasurementData = measurements.find(
    (measurement) => measurement.id === selectedMeasurement
  );

  const handleAddSuccess = () => {
    toast.success("Body measurement added successfully!");
  };

  const handleEditSuccess = () => {
    setSelectedMeasurement("");
    toast.success("Body measurement updated successfully!");
  };

  const handleDelete = async () => {
    if (!selectedMeasurement) return;

    setIsDeleting(true);

    try {
      await ApiService.deleteRecord(selectedMeasurement);
      deleteEntry(selectedMeasurement, "body_measurements" as DataStoreName);
      toast.success("Body measurement deleted successfully!");
      setSelectedMeasurement("");
    } catch (error) {
      console.error("Error deleting body measurement:", error);
      toast.error("Failed to delete body measurement");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedMeasurement("");
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Body Measurement Manager"
      description="Add new body measurements or update existing ones."
      open={open}
      onOpenChange={handleOpenChange}
      contentClassName="sm:max-w-[800px]"
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Manage Body Measurements
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
                    Add New Measurement
                  </div>
                ),
                content: (
                  <div className="pt-2">
                    <DataForm
                      datasetId="body_measurements"
                      fields={bodyMeasurementFields}
                      onSuccess={handleAddSuccess}
                      submitLabel="Add Body Measurement"
                      mode="add"
                      title="Add New Body Measurement"
                    />
                  </div>
                ),
              },
              {
                id: "edit",
                label: (
                  <div className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit Measurement
                  </div>
                ),
                content: (
                  <div className="pt-2">
                    {measurements.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No body measurements available to edit. Please add a
                        measurement first.
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <h3 className="text-sm font-medium mb-2">
                            Select Body Measurement to Edit:
                          </h3>
                          <ReusableSelect
                            options={measurementOptions}
                            value={selectedMeasurement}
                            onChange={setSelectedMeasurement}
                            title="Body Measurement"
                            placeholder="Select a body measurement..."
                          />
                          {selectedMeasurement && (
                            <div className="mt-3">
                              <ConfirmDeleteDialog
                                title="Delete Body Measurement"
                                description="Are you sure you want to delete this body measurement? This action cannot be undone."
                                onConfirm={handleDelete}
                                loading={isDeleting}
                                triggerText="Delete Selected Measurement"
                                variant="destructive"
                                size="default"
                              />
                            </div>
                          )}
                        </div>
                        {selectedMeasurement && selectedMeasurementData ? (
                          <DataForm
                            datasetId="body_measurements"
                            fields={bodyMeasurementFields}
                            initialValues={
                              selectedMeasurementData as unknown as Record<
                                string,
                                unknown
                              >
                            }
                            onSuccess={handleEditSuccess}
                            onCancel={() => setSelectedMeasurement("")}
                            submitLabel="Update Body Measurement"
                            mode="edit"
                            recordId={selectedMeasurement}
                          />
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            Select a measurement to edit its details
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
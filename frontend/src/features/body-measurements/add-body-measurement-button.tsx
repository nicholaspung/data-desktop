import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";

export default function AddBodyMeasurementButton() {
  const [open, setOpen] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const bodyMeasurementFields = getDatasetFields("body_measurements");

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <ReusableDialog
      title="Add Body Measurement"
      description="Record a new body measurement to track your physical progress over time."
      open={open}
      onOpenChange={setOpen}
      showTrigger={true}
      trigger={
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Measurement
        </Button>
      }
      customContent={
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <DataForm
            datasetId="body_measurements"
            fields={bodyMeasurementFields}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            submitLabel="Add Measurement"
            persistKey="body_measurement_form"
          />
        </div>
      }
      customFooter={<div />}
    />
  );
}
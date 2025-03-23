// src/features/bloodwork/bloodwork-form.tsx
import { useFieldDefinitions } from "../field-definitions/field-definitions-store";
import DataForm from "@/components/data-form/data-form";

interface BloodworkFormProps {
  onSuccess?: () => void;
}

export default function BloodworkForm({ onSuccess }: BloodworkFormProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkFields = getDatasetFields("bloodwork");

  return (
    <DataForm
      datasetId="bloodwork"
      fields={bloodworkFields}
      onSuccess={onSuccess}
      submitLabel="Add Bloodwork Results"
      successMessage="Bloodwork results added successfully"
    />
  );
}

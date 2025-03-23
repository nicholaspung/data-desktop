// src/features/dexa/dexa-form.tsx
import { useFieldDefinitions } from "../field-definitions/field-definitions-store";
import DataForm from "@/components/data-form/data-form";

interface DexaFormProps {
  onSuccess?: () => void;
}

export default function DexaForm({ onSuccess }: DexaFormProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  return (
    <DataForm
      datasetId="dexa"
      fields={dexaFields}
      onSuccess={onSuccess}
      submitLabel="Add DEXA Scan"
      successMessage="DEXA scan added successfully"
    />
  );
}

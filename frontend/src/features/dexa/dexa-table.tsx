// src/features/dexa/dexa-table.tsx
import { useFieldDefinitions } from "../field-definitions/field-definitions-store";
import GenericDataTable from "@/components/data-table/generic-data-table";

interface DexaTableProps {
  onDataChange?: () => void;
}

export default function DexaTable({ onDataChange }: DexaTableProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  return (
    <GenericDataTable
      datasetId="dexa"
      fields={dexaFields}
      title="DEXA Scan Results"
      onDataChange={onDataChange}
      pageSize={10}
    />
  );
}

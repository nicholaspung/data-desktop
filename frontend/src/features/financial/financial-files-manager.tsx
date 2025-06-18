import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import DataLogsManager from "@/components/data-logs-manager/data-logs-manager";
import { FinancialFile } from "./types";

interface FinancialFilesManagerProps {
  files: FinancialFile[];
  onUpdate?: () => void;
}

export default function FinancialFilesManager({
  files,
  onUpdate,
}: FinancialFilesManagerProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const fieldDefinitions = getDatasetFields("financial_files");

  return (
    <DataLogsManager
      logs={files}
      fieldDefinitions={fieldDefinitions}
      datasetId="financial_files"
      onUpdate={onUpdate}
      title="Financial Files"
      primaryField="date"
      dateField="date"
      compactFields={["date", "files"]}
      sortableFields={["date"]}
      defaultSortField="date"
      defaultSortOrder="desc"
    />
  );
}

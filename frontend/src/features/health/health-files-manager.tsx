import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import DataLogsManager from "@/components/data-logs-manager/data-logs-manager";
import { HealthFile } from "./types";

interface HealthFilesManagerProps {
  files: HealthFile[];
  onUpdate?: () => void;
}

export default function HealthFilesManager({
  files,
  onUpdate,
}: HealthFilesManagerProps) {
  const { getDatasetFields } = useFieldDefinitions();
  const fieldDefinitions = getDatasetFields("health_files");

  return (
    <DataLogsManager
      logs={files}
      fieldDefinitions={fieldDefinitions}
      datasetId="health_files"
      onUpdate={onUpdate}
      title="Health Files"
      primaryField="date"
      dateField="date"
      compactFields={["date", "files"]}
      sortableFields={["date"]}
      defaultSortField="date"
      defaultSortOrder="desc"
    />
  );
}
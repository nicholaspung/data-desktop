import { DataLogsManager } from "@/components/data-logs-manager";
import type { FinancialLog } from "@/features/financial/types";
import { FINANCIAL_LOGS_FIELD_DEFINITIONS } from "@/features/field-definitions/financial-definitions";

interface FinancialLogsManagerProps {
  logs: FinancialLog[];
  onUpdate?: () => void;
}

export default function FinancialLogsManager({
  logs,
  onUpdate,
}: FinancialLogsManagerProps) {
  return (
    <DataLogsManager<FinancialLog>
      logs={logs}
      fieldDefinitions={FINANCIAL_LOGS_FIELD_DEFINITIONS.fields}
      onUpdate={onUpdate}
      title="Financial Logs"
      primaryField="description"
      amountField="amount"
      dateField="date"
      badgeFields={["category"]}
      tagFields={["tags"]}
      compactFields={["date", "description", "category", "tags", "amount"]}
      hideFields={["createdAt", "lastModified"]}
    />
  );
}
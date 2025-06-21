import { DataLogsManager } from "@/components/data-logs-manager";
import type { FinancialBalance } from "@/features/financial/types";
import { FINANCIAL_BALANCES_FIELD_DEFINITIONS } from "@/features/field-definitions/financial-definitions";

interface FinancialBalancesManagerProps {
  balances: FinancialBalance[];
  onUpdate?: () => void;
}

export default function FinancialBalancesManager({
  balances,
  onUpdate,
}: FinancialBalancesManagerProps) {
  return (
    <DataLogsManager<FinancialBalance>
      logs={balances}
      fieldDefinitions={FINANCIAL_BALANCES_FIELD_DEFINITIONS.fields}
      datasetId="financial_balances"
      onUpdate={onUpdate}
      title="Financial Balances"
      primaryField="account_name"
      amountField="amount"
      dateField="date"
      badgeFields={["account_type", "account_owner"]}
      compactFields={[
        "date",
        "account_name",
        "account_type",
        "account_owner",
        "amount",
      ]}
      hideFields={["createdAt", "lastModified"]}
      defaultSortField="date"
      defaultSortOrder="desc"
      filterableFields={["account_type", "account_owner"]}
    />
  );
}

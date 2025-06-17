import { DataLogsManager } from "@/components/data-logs-manager";
import type { PaycheckInfo } from "@/features/financial/types";
import { PAYCHECK_INFO_FIELD_DEFINITIONS } from "@/features/field-definitions/financial-definitions";

interface PaycheckLogsManagerProps {
  paychecks: PaycheckInfo[];
  onUpdate?: () => void;
}

export default function PaycheckLogsManager({
  paychecks,
  onUpdate,
}: PaycheckLogsManagerProps) {
  return (
    <DataLogsManager<PaycheckInfo>
      logs={paychecks}
      fieldDefinitions={PAYCHECK_INFO_FIELD_DEFINITIONS.fields}
      onUpdate={onUpdate}
      title="Paycheck Information"
      primaryField="category"
      amountField="amount"
      dateField="date"
      badgeFields={["deduction_type"]}
      compactFields={["date", "category", "deduction_type", "amount"]}
      hideFields={["createdAt", "lastModified"]}
      defaultSortField="date"
      defaultSortOrder="desc"
      formatters={{
        amount: (value, record) => {
          const isDeduction = ["Tax", "Benefit", "Investment"].includes(record.deduction_type);
          return (
            <span className={isDeduction ? "text-red-600" : "text-green-600"}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Math.abs(value))}
            </span>
          );
        },
      }}
    />
  );
}
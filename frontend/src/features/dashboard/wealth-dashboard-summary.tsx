import { useMemo, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { DollarSign, TrendingUp } from "lucide-react";
import ReusableSummary from "@/components/reusable/reusable-summary";
import {
  FinancialLog,
  FinancialBalance,
  PaycheckInfo,
} from "@/features/financial/types";
import { formatCurrency } from "@/lib/data-utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function WealthDashboardSummary() {
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [selectedAccountOwners, setSelectedAccountOwners] = useState<string[]>(
    []
  );

  const rawFinancialLogs = useStore(
    dataStore,
    (state) => state.financial_logs as FinancialLog[]
  );
  const financialLogs = useMemo(
    () => rawFinancialLogs || [],
    [rawFinancialLogs]
  );

  const rawFinancialBalances = useStore(
    dataStore,
    (state) => state.financial_balances as FinancialBalance[]
  );
  const financialBalances = useMemo(
    () => rawFinancialBalances || [],
    [rawFinancialBalances]
  );

  const rawPaycheckInfo = useStore(
    dataStore,
    (state) => state.paycheck_info as PaycheckInfo[]
  );
  const paycheckInfo = useMemo(() => rawPaycheckInfo || [], [rawPaycheckInfo]);

  const currentYear = new Date().getFullYear();

  const yearlyFinancialSummary = useMemo(() => {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearlyLogs = financialLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= yearStart && logDate <= yearEnd;
    });

    const totalExpenses = yearlyLogs
      .filter((log) => log.amount < 0)
      .reduce((sum, log) => sum + Math.abs(log.amount), 0);

    const totalIncome = yearlyLogs
      .filter((log) => log.amount > 0)
      .reduce((sum, log) => sum + log.amount, 0);

    const netFlow = totalIncome - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      netFlow,
      transactionCount: yearlyLogs.length,
    };
  }, [financialLogs, currentYear]);

  const paycheckSummary = useMemo(() => {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearlyPaychecks = paycheckInfo.filter((paycheck) => {
      const paycheckDate = new Date(paycheck.date);
      return paycheckDate >= yearStart && paycheckDate <= yearEnd;
    });

    const totalGross = yearlyPaychecks
      .filter(
        (p) =>
          p.category.toLowerCase().includes("gross") ||
          p.category.toLowerCase().includes("salary")
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDeductions = yearlyPaychecks
      .filter(
        (p) => p.deduction_type?.toLowerCase() === "deduction" || p.amount < 0
      )
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);

    const totalNet = yearlyPaychecks
      .filter(
        (p) =>
          p.category.toLowerCase().includes("net") ||
          (p.deduction_type?.toLowerCase() !== "deduction" &&
            p.amount > 0 &&
            !p.category.toLowerCase().includes("gross"))
      )
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalGross,
      totalDeductions,
      totalNet: totalNet || totalGross - totalDeductions,
      entryCount: yearlyPaychecks.length,
    };
  }, [paycheckInfo, currentYear]);

  const netWorthSummary = useMemo(() => {
    if (!financialBalances.length) {
      return {
        totalNetWorth: 0,
        filteredNetWorth: 0,
        accountTypes: [],
        accountOwners: [],
        latestBalances: [],
      };
    }

    const accountTypes = [
      ...new Set(financialBalances.map((b) => b.account_type)),
    ];
    const accountOwners = [
      ...new Set(financialBalances.map((b) => b.account_owner)),
    ];

    const latestBalances = new Map<string, FinancialBalance>();

    financialBalances.forEach((balance) => {
      const key = `${balance.account_name}-${balance.account_type}-${balance.account_owner}`;
      const existing = latestBalances.get(key);

      if (!existing || new Date(balance.date) > new Date(existing.date)) {
        latestBalances.set(key, balance);
      }
    });

    const latestBalancesArray = Array.from(latestBalances.values());

    const totalNetWorth = latestBalancesArray.reduce(
      (sum, balance) => sum + balance.amount,
      0
    );

    let filteredBalances = latestBalancesArray;

    if (selectedAccountTypes.length > 0) {
      filteredBalances = filteredBalances.filter((b) =>
        selectedAccountTypes.includes(b.account_type)
      );
    }

    if (selectedAccountOwners.length > 0) {
      filteredBalances = filteredBalances.filter((b) =>
        selectedAccountOwners.includes(b.account_owner)
      );
    }

    const filteredNetWorth = filteredBalances.reduce(
      (sum, balance) => sum + balance.amount,
      0
    );

    return {
      totalNetWorth,
      filteredNetWorth,
      accountTypes,
      accountOwners,
      latestBalances: latestBalancesArray,
    };
  }, [financialBalances, selectedAccountTypes, selectedAccountOwners]);

  const hasData =
    financialLogs.length > 0 ||
    financialBalances.length > 0 ||
    paycheckInfo.length > 0;

  if (!hasData) {
    return (
      <ReusableSummary
        title="Wealth Dashboard"
        titleIcon={<DollarSign className="h-5 w-5 text-primary" />}
        linkText="View Wealth"
        linkTo="/wealth"
        emptyState={{
          message: "No wealth data available yet",
          actionText: "Add Financial Data",
          actionTo: "/wealth",
        }}
      />
    );
  }

  const accountTypeOptions = [
    { id: "all-types", label: "All Types" },
    ...netWorthSummary.accountTypes.map((type) => ({ id: type, label: type })),
  ];

  const accountOwnerOptions = [
    { id: "all-owners", label: "All Owners" },
    ...netWorthSummary.accountOwners.map((owner) => ({
      id: owner,
      label: owner,
    })),
  ];

  const filterControls = (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Net Worth Filters:</div>
      <div className="flex flex-wrap gap-2">
        <ReusableSelect
          options={accountTypeOptions}
          value={
            selectedAccountTypes.length === 0
              ? "all-types"
              : selectedAccountTypes.join(",")
          }
          onChange={(value) =>
            setSelectedAccountTypes(
              value === "all-types" ? [] : value ? value.split(",") : []
            )
          }
          placeholder="Account Types"
          triggerClassName="w-32 h-7 text-xs"
          noDefault={false}
        />
        <ReusableSelect
          options={accountOwnerOptions}
          value={
            selectedAccountOwners.length === 0
              ? "all-owners"
              : selectedAccountOwners.join(",")
          }
          onChange={(value) =>
            setSelectedAccountOwners(
              value === "all-owners" ? [] : value ? value.split(",") : []
            )
          }
          placeholder="Owners"
          triggerClassName="w-32 h-7 text-xs"
          noDefault={false}
        />
      </div>
    </div>
  );

  const netWorthDisplay =
    selectedAccountTypes.length > 0 || selectedAccountOwners.length > 0
      ? netWorthSummary.filteredNetWorth
      : netWorthSummary.totalNetWorth;

  const isFiltered =
    selectedAccountTypes.length > 0 || selectedAccountOwners.length > 0;

  const renderSection = (section: any, index: number, isLast: boolean) => (
    <div key={index}>
      <div className={section.className}>
        {section.title && (
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium">{section.title}</p>
          </div>
        )}
        <div
          className={`grid gap-3 ${
            section.columns === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {section.items.map((item: any, itemIndex: number) => (
            <div key={itemIndex} className="space-y-1">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="text-lg font-semibold">{item.value}</div>
              {item.subText && (
                <div className="text-xs text-muted-foreground">
                  {item.subText}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!isLast && <Separator className="my-4" />}
    </div>
  );

  const sections = [
    {
      title: `${currentYear} Financial Activity`,
      items: [
        {
          label: "Total Income",
          value: (
            <span className="text-green-600">
              {formatCurrency(yearlyFinancialSummary.totalIncome)}
            </span>
          ),
        },
        {
          label: "Total Expenses",
          value: (
            <span className="text-red-600">
              {formatCurrency(yearlyFinancialSummary.totalExpenses)}
            </span>
          ),
        },
        {
          label: "Net Cash Flow",
          value: (
            <div className="flex items-center gap-1">
              <span
                className={
                  yearlyFinancialSummary.netFlow >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatCurrency(yearlyFinancialSummary.netFlow)}
              </span>
              {yearlyFinancialSummary.netFlow >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
              )}
            </div>
          ),
          subText: `${yearlyFinancialSummary.transactionCount} transactions`,
        },
      ],
      columns: 1 as const,
    },
    ...(paycheckSummary.entryCount > 0
      ? [
          {
            title: `${currentYear} Paycheck Summary`,
            items: [
              {
                label: "Gross Income",
                value: (
                  <span className="text-blue-600">
                    {formatCurrency(paycheckSummary.totalGross)}
                  </span>
                ),
              },
              {
                label: "Total Deductions",
                value: (
                  <span className="text-orange-600">
                    {formatCurrency(paycheckSummary.totalDeductions)}
                  </span>
                ),
              },
              {
                label: "Net Income",
                value: (
                  <span className="text-green-600">
                    {formatCurrency(paycheckSummary.totalNet)}
                  </span>
                ),
                subText: `${paycheckSummary.entryCount} entries`,
              },
            ],
            columns: 1 as const,
          },
        ]
      : []),
  ];

  return (
    <ReusableSummary
      title="Wealth Dashboard"
      titleIcon={<DollarSign className="h-5 w-5 text-primary" />}
      linkText="View All"
      linkTo="/wealth"
      customContent={
        <div className="space-y-4">
          {/* Main Section */}
          <div>
            <p className="text-sm text-muted-foreground">Current Net Worth</p>
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      netWorthDisplay >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatCurrency(netWorthDisplay)}
                  </span>
                  {isFiltered && (
                    <Badge variant="outline" className="text-xs">
                      Filtered
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {netWorthSummary.latestBalances.length} latest account
              balances
            </p>
            {netWorthSummary.accountTypes.length > 1 && filterControls}
          </div>

          <Separator />

          {/* Sections with separators */}
          {sections.map((section, index) =>
            renderSection(section, index, index === sections.length - 1)
          )}
        </div>
      }
    />
  );
}

registerDashboardSummary({
  route: "/wealth",
  component: WealthDashboardSummary,
  defaultConfig: {
    id: "/wealth",
    size: "medium",
    order: 7,
    visible: true,
  },
  datasets: [
    "financial_logs",
    "financial_balances",
    "paycheck_info",
    "financial_files",
  ],
  name: "Wealth",
  description: "Track finances, income, expenses, and financial documents",
  icon: DollarSign,
});

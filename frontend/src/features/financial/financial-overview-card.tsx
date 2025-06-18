import { useState, useMemo, useEffect } from "react";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, isSameMonth, isSameYear } from "date-fns";
import type { FinancialLog, FinancialBalance, PaycheckInfo } from "./types";

type TimeFilter = "month" | "year" | "all";

interface FinancialOverviewCardProps {
  title: string;
  logs?: FinancialLog[];
  balances?: FinancialBalance[];
  paychecks?: PaycheckInfo[];
  type: "logs" | "balances" | "paycheck";
  children: (
    filteredData: (FinancialLog | FinancialBalance | PaycheckInfo)[]
  ) => React.ReactNode;
}

export function FinancialOverviewCard({
  title,
  logs = [],
  balances = [],
  paychecks = [],
  type,
  children,
}: FinancialOverviewCardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState<Date | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [selectedAccountOwners, setSelectedAccountOwners] = useState<string[]>(
    []
  );
  const [selectedDeductionTypes, setSelectedDeductionTypes] = useState<string[]>(
    []
  );

  const allData = useMemo(() => {
    if (type === "logs") return logs;
    if (type === "balances") return balances;
    if (type === "paycheck") return paychecks;
    return [];
  }, [logs, balances, paychecks, type]);

  const availablePeriods = useMemo(() => {
    const monthsSet = new Set<string>();
    const yearsSet = new Set<string>();

    allData.forEach((item) => {
      const date = new Date(item.date);
      monthsSet.add(format(date, "yyyy-MM"));
      yearsSet.add(format(date, "yyyy"));
    });

    const months = Array.from(monthsSet)
      .sort()
      .reverse()
      .map((monthStr) => {
        const [year, month] = monthStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1);
      });

    const years = Array.from(yearsSet)
      .sort()
      .reverse()
      .map((yearStr) => new Date(parseInt(yearStr), 0));

    return { months, years };
  }, [allData]);

  const filterOptions = useMemo(() => {
    if (type === "logs") {
      const categories = new Set<string>();
      const tags = new Set<string>();

      (allData as FinancialLog[]).forEach((log) => {
        if (log.category) categories.add(log.category);
        if (log.tags) {
          log.tags.split(",").forEach((tag) => tags.add(tag.trim()));
        }
      });

      return {
        categories: Array.from(categories)
          .sort()
          .map((cat) => ({ id: cat, label: cat })),
        tags: Array.from(tags)
          .sort()
          .map((tag) => ({ id: tag, label: tag })),
      };
    } else if (type === "balances") {
      const accountTypes = new Set<string>();
      const accountOwners = new Set<string>();

      (allData as FinancialBalance[]).forEach((balance) => {
        if (balance.account_type) accountTypes.add(balance.account_type);
        if (balance.account_owner) accountOwners.add(balance.account_owner);
      });

      return {
        accountTypes: Array.from(accountTypes)
          .sort()
          .map((type) => ({ id: type, label: type })),
        accountOwners: Array.from(accountOwners)
          .sort()
          .map((owner) => ({ id: owner, label: owner })),
      };
    } else if (type === "paycheck") {
      const categories = new Set<string>();
      const deductionTypes = new Set<string>();

      (allData as PaycheckInfo[]).forEach((paycheck) => {
        if (paycheck.category) categories.add(paycheck.category);
        if (paycheck.deduction_type) deductionTypes.add(paycheck.deduction_type);
      });

      return {
        categories: Array.from(categories)
          .sort()
          .map((cat) => ({ id: cat, label: cat })),
        deductionTypes: Array.from(deductionTypes)
          .sort()
          .map((type) => ({ id: type, label: type })),
      };
    }

    return {};
  }, [allData, type]);

  const filteredData = useMemo(() => {
    const filterByDate = (date: string) => {
      const itemDate = new Date(date);
      if (timeFilter === "month" && selectedMonth) {
        return (
          isSameMonth(itemDate, selectedMonth) &&
          isSameYear(itemDate, selectedMonth)
        );
      } else if (timeFilter === "year" && selectedYear) {
        return isSameYear(itemDate, selectedYear);
      }
      return true;
    };

    const filterByContent = (
      item: FinancialLog | FinancialBalance | PaycheckInfo
    ) => {
      if (type === "logs") {
        const log = item as FinancialLog;
        const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.includes(log.category);
        const tagMatch =
          selectedTags.length === 0 ||
          (log.tags &&
            log.tags
              .split(",")
              .some((tag) => selectedTags.includes(tag.trim())));
        return categoryMatch && (tagMatch || !log.tags);
      } else if (type === "balances") {
        const balance = item as FinancialBalance;
        const typeMatch =
          selectedAccountTypes.length === 0 ||
          selectedAccountTypes.includes(balance.account_type);
        const ownerMatch =
          selectedAccountOwners.length === 0 ||
          selectedAccountOwners.includes(balance.account_owner);
        return typeMatch && ownerMatch;
      } else if (type === "paycheck") {
        const paycheck = item as PaycheckInfo;
        const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.includes(paycheck.category);
        const deductionTypeMatch =
          selectedDeductionTypes.length === 0 ||
          selectedDeductionTypes.includes(paycheck.deduction_type);
        return categoryMatch && deductionTypeMatch;
      }
      return true;
    };

    if (type === "logs" && logs) {
      return logs.filter(
        (log) => filterByDate(log.date) && filterByContent(log)
      );
    } else if (type === "balances" && balances) {
      const latestBalances = new Map<string, FinancialBalance>();

      balances
        .filter(
          (balance) => filterByDate(balance.date) && filterByContent(balance)
        )
        .forEach((balance) => {
          const key = `${balance.account_name}-${balance.account_type}-${balance.account_owner}`;
          const existing = latestBalances.get(key);
          if (!existing || new Date(balance.date) > new Date(existing.date)) {
            latestBalances.set(key, balance);
          }
        });

      return Array.from(latestBalances.values());
    } else if (type === "paycheck" && paychecks) {
      return paychecks.filter(
        (paycheck) => filterByDate(paycheck.date) && filterByContent(paycheck)
      );
    }
    return [];
  }, [
    logs,
    balances,
    paychecks,
    type,
    timeFilter,
    selectedMonth,
    selectedYear,
    selectedCategories,
    selectedTags,
    selectedAccountTypes,
    selectedAccountOwners,
    selectedDeductionTypes,
  ]);

  const summaryData = useMemo(() => {
    if (type === "logs") {
      const categoryTotals = new Map<string, number>();
      (filteredData as FinancialLog[]).forEach((log) => {
        const current = categoryTotals.get(log.category) || 0;
        categoryTotals.set(log.category, current + log.amount);
      });

      return {
        categories: Array.from(categoryTotals.entries()).map(
          ([category, total]) => ({
            category,
            total: Math.abs(total),
          })
        ),
        total: (filteredData as FinancialLog[]).reduce(
          (sum, log) => sum + log.amount,
          0
        ),
      };
    } else if (type === "balances") {
      const typeTotals = new Map<string, number>();
      (filteredData as FinancialBalance[]).forEach((balance) => {
        const current = typeTotals.get(balance.account_type) || 0;
        typeTotals.set(balance.account_type, current + balance.amount);
      });

      return {
        categories: Array.from(typeTotals.entries()).map(
          ([category, total]) => ({
            category,
            total: Math.abs(total),
          })
        ),
        total: (filteredData as FinancialBalance[]).reduce(
          (sum, balance) => sum + balance.amount,
          0
        ),
      };
    } else if (type === "paycheck") {
      const categoryTotals = new Map<string, number>();
      (filteredData as PaycheckInfo[]).forEach((paycheck) => {
        const current = categoryTotals.get(paycheck.category) || 0;
        categoryTotals.set(paycheck.category, current + paycheck.amount);
      });

      return {
        categories: Array.from(categoryTotals.entries()).map(
          ([category, total]) => ({
            category,
            total: Math.abs(total),
          })
        ),
        total: (filteredData as PaycheckInfo[]).reduce(
          (sum, paycheck) => sum + paycheck.amount,
          0
        ),
      };
    }

    return { categories: [], total: 0 };
  }, [filteredData, type]);

  const chartData = useMemo(() => {
    if (type === "logs") {
      const monthlyData = new Map<string, number>();
      (filteredData as FinancialLog[]).forEach((log) => {
        const month = format(new Date(log.date), "MMM yyyy");
        const current = monthlyData.get(month) || 0;
        monthlyData.set(month, current + Math.abs(log.amount));
      });

      return Array.from(monthlyData.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        );
    } else if (type === "balances") {
      return summaryData.categories;
    } else if (type === "paycheck") {
      const monthlyData = new Map<string, number>();
      (filteredData as PaycheckInfo[]).forEach((paycheck) => {
        const month = format(new Date(paycheck.date), "MMM yyyy");
        const current = monthlyData.get(month) || 0;
        monthlyData.set(month, current + Math.abs(paycheck.amount));
      });

      return Array.from(monthlyData.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        );
    }
    return [];
  }, [filteredData, type, summaryData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const timeFilterOptions = [
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "all", label: "All Time" },
  ];

  const uniqueMonths = useMemo(() => {
    if (!selectedMonth) return [];

    const monthsSet = new Set<number>();
    const selectedYear = selectedMonth.getFullYear();

    allData.forEach((item) => {
      const date = new Date(item.date);
      if (date.getFullYear() === selectedYear) {
        monthsSet.add(date.getMonth());
      }
    });

    return Array.from(monthsSet)
      .sort((a, b) => a - b)
      .map((month) => ({
        id: month.toString(),
        label: format(new Date(2000, month, 1), "MMMM"),
      }));
  }, [allData, selectedMonth]);

  const yearOptions = availablePeriods.years.map((year) => ({
    id: year.toISOString(),
    label: format(year, "yyyy"),
  }));

  useEffect(() => {
    if (availablePeriods.months.length > 0 && !selectedMonth) {
      setSelectedMonth(availablePeriods.months[0]);
    }
  }, [availablePeriods.months, selectedMonth]);

  useEffect(() => {
    if (yearOptions.length > 0 && !selectedYear) {
      setSelectedYear(new Date(yearOptions[0].id));
    }
  }, [yearOptions, selectedYear]);

  useEffect(() => {
    if (
      type === "logs" &&
      filterOptions.categories &&
      selectedCategories.length === 0
    ) {
      setSelectedCategories(filterOptions.categories.map((cat) => cat.id));
    }
    if (type === "logs" && filterOptions.tags && selectedTags.length === 0) {
      setSelectedTags(filterOptions.tags.map((tag) => tag.id));
    }
    if (
      type === "balances" &&
      filterOptions.accountTypes &&
      selectedAccountTypes.length === 0
    ) {
      setSelectedAccountTypes(
        filterOptions.accountTypes.map((type) => type.id)
      );
    }
    if (
      type === "balances" &&
      filterOptions.accountOwners &&
      selectedAccountOwners.length === 0
    ) {
      setSelectedAccountOwners(
        filterOptions.accountOwners.map((owner) => owner.id)
      );
    }
    if (
      type === "paycheck" &&
      filterOptions.categories &&
      selectedCategories.length === 0
    ) {
      setSelectedCategories(filterOptions.categories.map((cat) => cat.id));
    }
    if (
      type === "paycheck" &&
      filterOptions.deductionTypes &&
      selectedDeductionTypes.length === 0
    ) {
      setSelectedDeductionTypes(filterOptions.deductionTypes.map((type) => type.id));
    }
  }, [
    filterOptions,
    type,
    selectedCategories.length,
    selectedTags.length,
    selectedAccountTypes.length,
    selectedAccountOwners.length,
    selectedDeductionTypes.length,
  ]);

  useEffect(() => {
    if (timeFilter === "month" && selectedMonth && uniqueMonths.length > 0) {
      const currentMonth = selectedMonth.getMonth();
      const hasCurrentMonth = uniqueMonths.some(
        (month) => parseInt(month.id) === currentMonth
      );

      if (!hasCurrentMonth) {
        const firstAvailableMonth = parseInt(uniqueMonths[0].id);
        const newDate = new Date(selectedMonth);
        newDate.setMonth(firstAvailableMonth);
        setSelectedMonth(newDate);
      }
    }
  }, [uniqueMonths, selectedMonth, timeFilter]);

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Period
        </label>
        <ReusableSelect
          options={timeFilterOptions}
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as TimeFilter)}
          placeholder="Select period"
          triggerClassName="w-32"
        />
      </div>

      {timeFilter === "month" && selectedMonth && (
        <>
          {uniqueMonths.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Month
              </label>
              <ReusableSelect
                options={uniqueMonths}
                value={selectedMonth.getMonth().toString()}
                onChange={(value) => {
                  const newMonth = parseInt(value);
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newMonth);
                  setSelectedMonth(newDate);
                }}
                placeholder="Select month"
                triggerClassName="w-32"
              />
            </div>
          )}
          {yearOptions.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Year
              </label>
              <ReusableSelect
                options={yearOptions}
                value={new Date(selectedMonth.getFullYear(), 0).toISOString()}
                onChange={(value) => {
                  const yearDate = new Date(value);
                  const newDate = new Date(selectedMonth);
                  newDate.setFullYear(yearDate.getFullYear());
                  setSelectedMonth(newDate);
                }}
                placeholder="Select year"
                triggerClassName="w-24"
              />
            </div>
          )}
        </>
      )}

      {timeFilter === "year" && yearOptions.length > 0 && selectedYear && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Year
          </label>
          <ReusableSelect
            options={yearOptions}
            value={selectedYear.toISOString()}
            onChange={(value) => setSelectedYear(new Date(value))}
            placeholder="Select year"
            triggerClassName="w-24"
          />
        </div>
      )}

      {type === "logs" && (
        <>
          {filterOptions.categories && filterOptions.categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Categories
              </label>
              <ReusableMultiSelect
                options={[
                  { id: "all", label: "All Categories" },
                  ...filterOptions.categories,
                ]}
                selected={selectedCategories}
                onChange={(values) => {
                  if (values.includes("all")) {
                    setSelectedCategories(
                      filterOptions.categories?.map((cat) => cat.id) || []
                    );
                  } else {
                    setSelectedCategories(values);
                  }
                }}
                placeholder="Categories"
                className="w-40"
                maxDisplay={0}
              />
            </div>
          )}
          {filterOptions.tags && filterOptions.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tags
              </label>
              <ReusableMultiSelect
                options={[
                  { id: "all", label: "All Tags" },
                  ...filterOptions.tags,
                ]}
                selected={selectedTags}
                onChange={(values) => {
                  if (values.includes("all")) {
                    setSelectedTags(
                      filterOptions.tags?.map((tag) => tag.id) || []
                    );
                  } else {
                    setSelectedTags(values);
                  }
                }}
                placeholder="Tags"
                className="w-40"
                maxDisplay={0}
              />
            </div>
          )}
        </>
      )}

      {type === "balances" && (
        <>
          {filterOptions.accountTypes &&
            filterOptions.accountTypes.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Account Types
                </label>
                <ReusableMultiSelect
                  options={[
                    { id: "all", label: "All Account Types" },
                    ...filterOptions.accountTypes,
                  ]}
                  selected={selectedAccountTypes}
                  onChange={(values) => {
                    if (values.includes("all")) {
                      setSelectedAccountTypes(
                        filterOptions.accountTypes?.map((type) => type.id) || []
                      );
                    } else {
                      setSelectedAccountTypes(values);
                    }
                  }}
                  placeholder="Account Types"
                  className="w-40"
                  maxDisplay={0}
                />
              </div>
            )}
          {filterOptions.accountOwners &&
            filterOptions.accountOwners.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Account Owners
                </label>
                <ReusableMultiSelect
                  options={[
                    { id: "all", label: "All Account Owners" },
                    ...filterOptions.accountOwners,
                  ]}
                  selected={selectedAccountOwners}
                  onChange={(values) => {
                    if (values.includes("all")) {
                      setSelectedAccountOwners(
                        filterOptions.accountOwners?.map((owner) => owner.id) ||
                          []
                      );
                    } else {
                      setSelectedAccountOwners(values);
                    }
                  }}
                  placeholder="Account Owners"
                  className="w-40"
                  maxDisplay={0}
                />
              </div>
            )}
        </>
      )}

      {type === "paycheck" && (
        <>
          {filterOptions.categories && filterOptions.categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Categories
              </label>
              <ReusableMultiSelect
                options={[
                  { id: "all", label: "All Categories" },
                  ...filterOptions.categories,
                ]}
                selected={selectedCategories}
                onChange={(values) => {
                  if (values.includes("all")) {
                    setSelectedCategories(
                      filterOptions.categories?.map((cat) => cat.id) || []
                    );
                  } else {
                    setSelectedCategories(values);
                  }
                }}
                placeholder="Categories"
                className="w-40"
                maxDisplay={0}
              />
            </div>
          )}
          {filterOptions.deductionTypes && filterOptions.deductionTypes.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Deduction Types
              </label>
              <ReusableMultiSelect
                options={[
                  { id: "all", label: "All Deduction Types" },
                  ...filterOptions.deductionTypes,
                ]}
                selected={selectedDeductionTypes}
                onChange={(values) => {
                  if (values.includes("all")) {
                    setSelectedDeductionTypes(
                      filterOptions.deductionTypes?.map((type) => type.id) || []
                    );
                  } else {
                    setSelectedDeductionTypes(values);
                  }
                }}
                placeholder="Deduction Types"
                className="w-40"
                maxDisplay={0}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  const content = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(summaryData.total)}
              </span>
            </div>
            {summaryData.categories.map(({ category, total }) => (
              <div
                key={category}
                className="flex justify-between items-center p-2 border rounded"
              >
                <span className="text-sm">{category}</span>
                <span className="text-sm font-medium">
                  {formatCurrency(total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {type === "balances" ? "Balance by Type" : "Monthly Trend"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={type === "balances" ? "category" : "month"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar
                  dataKey={type === "balances" ? "total" : "amount"}
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">{children(filteredData)}</div>
    </div>
  );

  return (
    <ReusableCard
      title={title}
      headerActions={headerActions}
      content={content}
      showHeader={true}
      useSeparator={true}
      cardClassName="w-full"
    />
  );
}

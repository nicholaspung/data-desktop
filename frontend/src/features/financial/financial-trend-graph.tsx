import { useState, useMemo, useCallback } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  isValid,
  addMonths,
  differenceInMonths,
  differenceInYears,
  isWithinInterval,
} from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { FinancialLog, FinancialBalance, PaycheckInfo } from "./types";
import { COLORS } from "@/lib/date-utils";

type DataType = "logs" | "balances" | "paycheck";
type GroupingPeriod = "month" | "year";
type ViewMode = "separate" | "net";
type ChartType = "line" | "bar";

interface FinancialTrendGraphProps {
  logs?: FinancialLog[];
  balances?: FinancialBalance[];
  paychecks?: PaycheckInfo[];
  type: DataType;
  title?: string;
}

interface TrendDataPoint {
  period: string;
  [key: string]: number | string;
}

export default function FinancialTrendGraph({
  logs,
  balances,
  paychecks,
  type,
  title = "Financial Trends",
}: FinancialTrendGraphProps) {
  const [groupingNumber, setGroupingNumber] = useState("1");
  const [groupingPeriod, setGroupingPeriod] = useState<GroupingPeriod>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("separate");
  const [chartType, setChartType] = useState<ChartType>("line");

  // Filter controls
  const [timeFilter, setTimeFilter] = useState<"all" | "range">("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags] = useState<string[]>([]);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [selectedAccountOwners, setSelectedAccountOwners] = useState<string[]>(
    []
  );
  const [selectedDeductionTypes, setSelectedDeductionTypes] = useState<
    string[]
  >([]);

  // Get the field name for grouping based on data type
  const getGroupingField = useCallback((): string => {
    switch (type) {
      case "logs":
        return "category";
      case "balances":
        return "account_type";
      case "paycheck":
        return "deduction_type";
    }
  }, [type]);

  // Generate options for the number selector
  const numberOptions = Array.from({ length: 24 }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  const periodOptions = [
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  // Get the appropriate data based on type
  const allData = useMemo(() => {
    switch (type) {
      case "logs":
        return logs || [];
      case "balances":
        return balances || [];
      case "paycheck":
        return paychecks || [];
      default:
        return [];
    }
  }, [type, logs, balances, paychecks]);

  // Calculate date range limits
  const dateRangeLimits = useMemo(() => {
    if (allData.length === 0) {
      return { minDate: null, maxDate: null };
    }

    const dates = allData
      .map((item) => {
        try {
          return typeof item.date === "string"
            ? parseISO(item.date)
            : item.date;
        } catch {
          return null;
        }
      })
      .filter((date): date is Date => date !== null && isValid(date))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      minDate: dates[0] || null,
      maxDate: dates[dates.length - 1] || null,
    };
  }, [allData]);

  // Generate filter options from data
  const filterOptions = useMemo(() => {
    if (allData.length === 0) {
      return {
        categories: [],
        tags: [],
        accountTypes: [],
        accountOwners: [],
        deductionTypes: [],
      };
    }

    const categories = new Set<string>();
    const tags = new Set<string>();
    const accountTypes = new Set<string>();
    const accountOwners = new Set<string>();
    const deductionTypes = new Set<string>();

    allData.forEach((item) => {
      if (type === "logs") {
        const log = item as FinancialLog;
        if (log.category) categories.add(log.category);
        if (log.tags) {
          log.tags.split(",").forEach((tag) => tags.add(tag.trim()));
        }
      } else if (type === "balances") {
        const balance = item as FinancialBalance;
        if (balance.account_type) accountTypes.add(balance.account_type);
        if (balance.account_owner) accountOwners.add(balance.account_owner);
      } else if (type === "paycheck") {
        const paycheck = item as PaycheckInfo;
        if (paycheck.category) categories.add(paycheck.category);
        if (paycheck.deduction_type)
          deductionTypes.add(paycheck.deduction_type);
      }
    });

    return {
      categories: Array.from(categories)
        .sort()
        .map((item) => ({ id: item, label: item })),
      tags: Array.from(tags)
        .sort()
        .map((item) => ({ id: item, label: item })),
      accountTypes: Array.from(accountTypes)
        .sort()
        .map((item) => ({ id: item, label: item })),
      accountOwners: Array.from(accountOwners)
        .sort()
        .map((item) => ({ id: item, label: item })),
      deductionTypes: Array.from(deductionTypes)
        .sort()
        .map((item) => ({ id: item, label: item })),
    };
  }, [allData, type]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    const filterByDate = (date: string | Date) => {
      const itemDate = typeof date === "string" ? parseISO(date) : date;

      if (timeFilter === "range" && startDate && endDate) {
        return isWithinInterval(itemDate, { start: startDate, end: endDate });
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

    const filtered = allData.filter(
      (item) => filterByDate(item.date) && filterByContent(item)
    );

    // For balances, we'll handle latest balance calculation in the trend data processing
    // to show proper historical snapshots per time period

    return filtered;
  }, [
    allData,
    type,
    timeFilter,
    startDate,
    endDate,
    selectedCategories,
    selectedTags,
    selectedAccountTypes,
    selectedAccountOwners,
    selectedDeductionTypes,
  ]);

  // Calculate trend data
  const trendData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const groupingField = getGroupingField();
    const num = parseInt(groupingNumber);

    // Helper function to convert date to Date object
    const toDate = (date: string | Date): Date => {
      if (date instanceof Date) return date;
      if (typeof date === "string") return parseISO(date);
      throw new Error("Invalid date type");
    };

    // Sort all data by date with error handling
    const sortedData = [...filteredData]
      .filter((item) => {
        // Ensure we have valid data with date field
        if (!item || !item.date) return false;
        try {
          const testDate = toDate(item.date);
          return isValid(testDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = toDate(a.date);
          const dateB = toDate(b.date);
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error("Error sorting dates:", a.date, b.date, error);
          return 0;
        }
      });

    if (sortedData.length === 0) {
      return [];
    }

    // Find the date range of all data
    let firstDate: Date;
    try {
      firstDate = toDate(sortedData[0].date);
    } catch (error) {
      console.error("Error parsing first date:", sortedData[0].date, error);
      return [];
    }

    if (type === "balances") {
      // For balances, we need to calculate snapshots for each period
      // showing the latest balance for each account as of that period

      // First, determine all periods we need to show
      const allPeriods = new Set<string>();
      const periodLabels = new Map<string, string>();

      sortedData.forEach((item) => {
        let itemDate: Date;
        try {
          itemDate = toDate(item.date);
        } catch {
          return;
        }

        if (!isValid(itemDate)) {
          return;
        }

        // Calculate which period this item belongs to
        let periodKey: string;
        let periodLabel: string;

        if (groupingPeriod === "month") {
          const firstPeriodStart = startOfMonth(firstDate);
          const monthsDiff = differenceInMonths(itemDate, firstPeriodStart);
          const periodIndex = Math.floor(monthsDiff / num);
          const periodStart = addMonths(firstPeriodStart, periodIndex * num);

          if (num === 1) {
            periodLabel = format(periodStart, "MMM yyyy");
          } else {
            const periodEnd = addMonths(periodStart, num - 1);
            periodLabel = `${format(periodStart, "MMM yyyy")} - ${format(periodEnd, "MMM yyyy")}`;
          }
          periodKey = format(periodStart, "yyyy-MM");
        } else {
          const firstPeriodStart = startOfYear(firstDate);
          const yearsDiff = differenceInYears(itemDate, firstPeriodStart);
          const periodIndex = Math.floor(yearsDiff / num);
          const periodStartYear =
            firstPeriodStart.getFullYear() + periodIndex * num;

          if (num === 1) {
            periodLabel = String(periodStartYear);
          } else {
            periodLabel = `${periodStartYear} - ${periodStartYear + num - 1}`;
          }
          periodKey = String(periodStartYear);
        }

        allPeriods.add(periodKey);
        periodLabels.set(periodKey, periodLabel);
      });

      // Now for each period, find the latest balance for each account
      const periodGroups = new Map<string, Map<string, number>>();
      const sortedPeriods = Array.from(allPeriods).sort();

      sortedPeriods.forEach((periodKey) => {
        const periodData = new Map<string, number>();

        // Get period end date for filtering
        let periodEndDate: Date;
        if (groupingPeriod === "month") {
          const [year, month] = periodKey.split("-").map(Number);
          // Create last day of the month at end of day (23:59:59.999)
          periodEndDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
          const year = parseInt(periodKey);
          // Create last day of the year period at end of day
          periodEndDate = new Date(year + num - 1, 11, 31, 23, 59, 59, 999);
        }

        // Find all accounts and their latest balance up to this period
        const accountLatestBalances = new Map<string, FinancialBalance>();

        (sortedData as FinancialBalance[]).forEach((balance) => {
          const balanceDate = toDate(balance.date);

          if (balanceDate <= periodEndDate) {
            const accountKey = `${balance.account_name}-${balance.account_type}-${balance.account_owner}`;
            const existing = accountLatestBalances.get(accountKey);
            const existingDate = existing ? toDate(existing.date) : null;

            if (!existing || balanceDate > existingDate!) {
              accountLatestBalances.set(accountKey, balance);
            }
          }
        });

        // Group balances by the appropriate field
        accountLatestBalances.forEach((balance) => {
          const groupKey =
            viewMode === "net"
              ? balance.amount >= 0
                ? "Assets"
                : "Liabilities"
              : ((balance as unknown as Record<string, unknown>)[
                  groupingField
                ] as string) || "Other";

          const currentValue = periodData.get(groupKey) || 0;
          periodData.set(groupKey, currentValue + balance.amount);
        });

        periodGroups.set(periodKey, periodData);
      });

      // Convert to chart data format
      const chartData: TrendDataPoint[] = [];
      const allGroups = new Set<string>();

      // First pass: collect all unique groups
      periodGroups.forEach((periodData) => {
        periodData.forEach((_, group) => allGroups.add(group));
      });

      // Generate data points for each period
      sortedPeriods.forEach((periodKey) => {
        const periodLabel = periodLabels.get(periodKey) || periodKey;
        const dataPoint: TrendDataPoint = { period: periodLabel };

        const periodData = periodGroups.get(periodKey);
        allGroups.forEach((group) => {
          dataPoint[group] = periodData?.get(group) || 0;
        });

        chartData.push(dataPoint);
      });

      return chartData;
    } else {
      // Original logic for logs and paycheck
      const periodGroups = new Map<string, Map<string, number>>();
      const periodLabels = new Map<string, string>();

      // Process all data
      sortedData.forEach((item) => {
        let itemDate: Date;
        try {
          itemDate = toDate(item.date);
        } catch {
          return;
        }

        if (!isValid(itemDate)) {
          return;
        }

        // Calculate which period this item belongs to
        let periodKey: string;
        let periodLabel: string;

        if (groupingPeriod === "month") {
          // Group by N-month periods
          const firstPeriodStart = startOfMonth(firstDate);
          const monthsDiff = differenceInMonths(itemDate, firstPeriodStart);
          const periodIndex = Math.floor(monthsDiff / num);
          const periodStart = addMonths(firstPeriodStart, periodIndex * num);

          if (num === 1) {
            periodLabel = format(periodStart, "MMM yyyy");
          } else {
            const periodEnd = addMonths(periodStart, num - 1);
            periodLabel = `${format(periodStart, "MMM yyyy")} - ${format(periodEnd, "MMM yyyy")}`;
          }
          periodKey = format(periodStart, "yyyy-MM");
        } else {
          // Group by N-year periods
          const firstPeriodStart = startOfYear(firstDate);
          const yearsDiff = differenceInYears(itemDate, firstPeriodStart);
          const periodIndex = Math.floor(yearsDiff / num);
          const periodStartYear =
            firstPeriodStart.getFullYear() + periodIndex * num;

          if (num === 1) {
            periodLabel = String(periodStartYear);
          } else {
            periodLabel = `${periodStartYear} - ${periodStartYear + num - 1}`;
          }
          periodKey = String(periodStartYear);
        }

        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, new Map());
        }

        const periodData = periodGroups.get(periodKey)!;
        const groupKey =
          viewMode === "net"
            ? item.amount >= 0
              ? "Income"
              : "Expense"
            : ((item as unknown as Record<string, unknown>)[
                groupingField
              ] as string) || "Other";

        const currentValue = periodData.get(groupKey) || 0;
        periodData.set(groupKey, currentValue + item.amount);

        // Store the period label
        periodLabels.set(periodKey, periodLabel);
      });

      // Convert to chart data format
      const chartData: TrendDataPoint[] = [];
      const allGroups = new Set<string>();

      // First pass: collect all unique groups
      periodGroups.forEach((periodData) => {
        periodData.forEach((_, group) => allGroups.add(group));
      });

      // Create sorted list of period keys
      const periodKeys = Array.from(periodGroups.keys()).sort();

      // Generate data points for each period
      periodKeys.forEach((periodKey) => {
        const periodLabel = periodLabels.get(periodKey) || periodKey;

        const dataPoint: TrendDataPoint = { period: periodLabel };

        const periodData = periodGroups.get(periodKey);
        allGroups.forEach((group) => {
          dataPoint[group] = periodData?.get(group) || 0;
        });

        chartData.push(dataPoint);
      });

      return chartData;
    }
  }, [filteredData, type, groupingNumber, groupingPeriod, viewMode, getGroupingField]);

  // Generate line/bar configurations
  const chartLines = useMemo(() => {
    if (trendData.length === 0) return [];

    const groups = Object.keys(trendData[0]).filter((key) => key !== "period");
    return groups.map((group, index) => ({
      dataKey: group,
      name: group,
      color: COLORS[index % COLORS.length],
      stackId: chartType === "bar" ? "stack" : undefined,
    }));
  }, [trendData, chartType]);

  // Calculate totals for display
  const totals = useMemo(() => {
    if (type === "balances") {
      // For balances, show current totals (latest balance per account), not sum across time
      const sums: Record<string, number> = {};
      if (trendData.length > 0) {
        // Get the latest period's data
        const latestPeriod = trendData[trendData.length - 1];
        Object.entries(latestPeriod).forEach(([key, value]) => {
          if (key !== "period" && typeof value === "number") {
            sums[key] = value;
          }
        });
      }
      return sums;
    } else {
      // For logs and paycheck, sum across all periods as before
      const sums: Record<string, number> = {};
      trendData.forEach((point) => {
        Object.entries(point).forEach(([key, value]) => {
          if (key !== "period" && typeof value === "number") {
            sums[key] = (sums[key] || 0) + value;
          }
        });
      });
      return sums;
    }
  }, [trendData, type]);

  return (
    <ReusableCard
      title={title}
      headerActions={
        <div className="flex gap-2">
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      }
      cardClassName="mt-4"
      content={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Group by</span>
              <ReusableSelect
                options={numberOptions}
                value={groupingNumber}
                onChange={setGroupingNumber}
                placeholder="Number"
                triggerClassName="w-20"
              />
              <ReusableSelect
                options={periodOptions}
                value={groupingPeriod}
                onChange={(value) => setGroupingPeriod(value as GroupingPeriod)}
                placeholder="Period"
                triggerClassName="w-28"
              />
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === "separate" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("separate")}
              >
                By {getGroupingField().replace("_", " ")}
              </Button>
              <Button
                variant={viewMode === "net" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("net")}
              >
                {type === "balances" ? "Assets vs Liabilities" : "Income vs Expense"}
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Time:</span>
              <ReusableSelect
                options={[
                  { id: "all", label: "All Time" },
                  { id: "range", label: "Date Range" },
                ]}
                value={timeFilter}
                onChange={(value) => {
                  const newValue = value as "all" | "range";
                  setTimeFilter(newValue);
                  if (newValue === "all") {
                    setStartDate(null);
                    setEndDate(null);
                  }
                }}
                placeholder="Time Filter"
                triggerClassName="w-32"
              />
            </div>

            {timeFilter === "range" && (
              <>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">From:</span>
                  <ReusableDatePicker
                    value={startDate || undefined}
                    onChange={(date) => setStartDate(date || null)}
                    placeholder="Start date"
                    disabled={!dateRangeLimits.minDate}
                    minDate={dateRangeLimits.minDate || undefined}
                    maxDate={endDate || dateRangeLimits.maxDate || undefined}
                    className="w-48"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">To:</span>
                  <ReusableDatePicker
                    value={endDate || undefined}
                    onChange={(date) => setEndDate(date || null)}
                    placeholder="End date"
                    disabled={!dateRangeLimits.maxDate}
                    minDate={startDate || dateRangeLimits.minDate || undefined}
                    maxDate={dateRangeLimits.maxDate || undefined}
                    className="w-48"
                  />
                </div>
              </>
            )}
          </div>

          {/* Multi-select filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {type === "logs" && (
              <>
                {filterOptions.categories.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">
                      Categories:
                    </span>
                    <ReusableMultiSelect
                      options={filterOptions.categories}
                      selected={selectedCategories}
                      onChange={setSelectedCategories}
                      placeholder="All categories"
                      title="categories"
                      className="w-64"
                      maxDisplay={0}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          selectedCategories.length ===
                          filterOptions.categories.length
                        ) {
                          setSelectedCategories([]);
                        } else {
                          setSelectedCategories(
                            filterOptions.categories.map((opt) => opt.id)
                          );
                        }
                      }}
                      className="text-xs"
                    >
                      {selectedCategories.length ===
                      filterOptions.categories.length
                        ? "Clear All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
              </>
            )}

            {type === "balances" && (
              <>
                {filterOptions.accountTypes.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">
                      Account Types:
                    </span>
                    <ReusableMultiSelect
                      options={filterOptions.accountTypes}
                      selected={selectedAccountTypes}
                      onChange={setSelectedAccountTypes}
                      placeholder="All account types"
                      title="account types"
                      className="w-64"
                      maxDisplay={0}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          selectedAccountTypes.length ===
                          filterOptions.accountTypes.length
                        ) {
                          setSelectedAccountTypes([]);
                        } else {
                          setSelectedAccountTypes(
                            filterOptions.accountTypes.map((opt) => opt.id)
                          );
                        }
                      }}
                      className="text-xs"
                    >
                      {selectedAccountTypes.length ===
                      filterOptions.accountTypes.length
                        ? "Clear All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
                {filterOptions.accountOwners.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">
                      Account Owners:
                    </span>
                    <ReusableMultiSelect
                      options={filterOptions.accountOwners}
                      selected={selectedAccountOwners}
                      onChange={setSelectedAccountOwners}
                      placeholder="All account owners"
                      title="account owners"
                      className="w-64"
                      maxDisplay={0}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          selectedAccountOwners.length ===
                          filterOptions.accountOwners.length
                        ) {
                          setSelectedAccountOwners([]);
                        } else {
                          setSelectedAccountOwners(
                            filterOptions.accountOwners.map((opt) => opt.id)
                          );
                        }
                      }}
                      className="text-xs"
                    >
                      {selectedAccountOwners.length ===
                      filterOptions.accountOwners.length
                        ? "Clear All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
              </>
            )}

            {type === "paycheck" && (
              <>
                {filterOptions.deductionTypes.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">
                      Deduction Types:
                    </span>
                    <ReusableMultiSelect
                      options={filterOptions.deductionTypes}
                      selected={selectedDeductionTypes}
                      onChange={setSelectedDeductionTypes}
                      placeholder="All deduction types"
                      title="deduction types"
                      className="w-64"
                      maxDisplay={0}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          selectedDeductionTypes.length ===
                          filterOptions.deductionTypes.length
                        ) {
                          setSelectedDeductionTypes([]);
                        } else {
                          setSelectedDeductionTypes(
                            filterOptions.deductionTypes.map((opt) => opt.id)
                          );
                        }
                      }}
                      className="text-xs"
                    >
                      {selectedDeductionTypes.length ===
                      filterOptions.deductionTypes.length
                        ? "Clear All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {trendData.length > 0 ? (
            <>
              {chartType === "line" ? (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis
                        tickFormatter={(value) => {
                          const num = Number(value);
                          const absNum = Math.abs(num);
                          const formatted = absNum.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                            notation:
                              absNum >= 1000000 ? "compact" : "standard",
                          });
                          return num < 0 ? `-$${formatted}` : `$${formatted}`;
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const num = Number(value);
                          const absNum = Math.abs(num);
                          const formatted = absNum.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                          return [
                            num < 0 ? `-$${formatted}` : `$${formatted}`,
                            name,
                          ];
                        }}
                      />
                      <Legend />
                      {chartLines.map((line) => (
                        <Line
                          key={`line-${line.dataKey}`}
                          type="monotone"
                          dataKey={line.dataKey}
                          name={line.name}
                          stroke={line.color}
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis
                        tickFormatter={(value) => {
                          const num = Number(value);
                          const absNum = Math.abs(num);
                          const formatted = absNum.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                            notation:
                              absNum >= 1000000 ? "compact" : "standard",
                          });
                          return num < 0 ? `-$${formatted}` : `$${formatted}`;
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const num = Number(value);
                          const absNum = Math.abs(num);
                          const formatted = absNum.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                          return [
                            num < 0 ? `-$${formatted}` : `$${formatted}`,
                            name,
                          ];
                        }}
                      />
                      <Legend />
                      {chartLines.map((bar) => (
                        <Bar
                          key={`bar-${bar.dataKey}`}
                          dataKey={bar.dataKey}
                          name={bar.name}
                          fill={bar.color}
                          stackId={bar.stackId}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Object.entries(totals).map(([category, total]) => {
                  const isPositive =
                    viewMode === "net" && 
                    (category === "Income" || (type === "balances" && category === "Assets"));
                  const isNegative =
                    viewMode === "net" && 
                    (category === "Expense" || (type === "balances" && category === "Liabilities"));
                  return (
                    <div key={category} className="text-center">
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        {category}
                        {isPositive && (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        )}
                        {isNegative && (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          isPositive
                            ? "text-green-600"
                            : isNegative
                              ? "text-red-600"
                              : total >= 0
                                ? "text-green-600"
                                : "text-red-600"
                        }`}
                      >
                        {total < 0
                          ? `-$${Math.abs(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available for the selected filters
            </div>
          )}
        </div>
      }
    />
  );
}

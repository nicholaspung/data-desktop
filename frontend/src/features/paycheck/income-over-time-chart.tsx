// src/features/paycheck/income-over-time-chart.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, ComposedChart } from "@/components/charts";
import { formatDate } from "@/lib/date-utils";

interface Paycheck {
  id: string;
  date: Date;
  gross_income: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  retirement_401k: number;
  health_insurance: number;
  dental_insurance: number;
  vision_insurance: number;
  other_deductions: number;
  net_income: number;
}

export default function IncomeOverTimeChart() {
  const [data, setData] = useState<Paycheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("income");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords<Paycheck>("paycheck");

      if (!records || records.length === 0) {
        setData([]);
        setError("No paycheck data available. Please add some records first.");
        return;
      }

      // Process the data
      const processedRecords = records
        .map((record) => ({
          ...record,
          date: new Date(record.date),
        }))
        // Sort by date
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setData(processedRecords);
    } catch (error) {
      console.error("Error loading paycheck data:", error);
      setError("Failed to load paycheck data");
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered data based on time range
  const getFilteredData = () => {
    if (timeRange === "all" || data.length === 0) return data;

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "ytd":
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
    }

    return data.filter((item) => item.date >= startDate);
  };

  // Prepare data for income trend chart
  const getIncomeTrendData = () => {
    return getFilteredData().map((item) => ({
      date: formatDate(item.date),
      gross: item.gross_income,
      net: item.net_income,
      dateObj: item.date,
    }));
  };

  // Prepare data for deductions trend chart
  const getDeductionsTrendData = () => {
    return getFilteredData().map((item) => ({
      date: formatDate(item.date),
      federalTax: item.federal_tax,
      stateTax: item.state_tax,
      socialSecurity: item.social_security,
      medicare: item.medicare,
      retirement: item.retirement_401k,
      health: item.health_insurance,
      dental: item.dental_insurance,
      vision: item.vision_insurance,
      other: item.other_deductions,
      dateObj: item.date,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          {error ||
            "No paycheck data available. Add your first paycheck to see visualizations."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
            <TabsTrigger value="rates">Tax Rates</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        {activeTab === "income" && (
          <LineChart
            data={getIncomeTrendData()}
            lines={[
              {
                dataKey: "gross",
                name: "Gross Income",
                // stroke: "#8884d8",
                strokeWidth: 2,
                activeDot: { r: 8 },
                unit: "$",
              },
              {
                dataKey: "net",
                name: "Net Income",
                // stroke: "#82ca9d",
                strokeWidth: 2,
                activeDot: { r: 8 },
                unit: "$",
              },
            ]}
            xAxisKey="date"
            title="Income Trend"
            height={400}
            tooltipFormatter={(value) => `$${Number(value).toFixed(2)}`}
          />
        )}

        {activeTab === "deductions" && (
          <ComposedChart
            data={getDeductionsTrendData()}
            elements={[
              {
                type: "bar",
                dataKey: "federalTax",
                name: "Federal Tax",
                color: "#8884d8",
                barSize: 20,
                unit: "$",
              },
              {
                type: "bar",
                dataKey: "stateTax",
                name: "State Tax",
                color: "#82ca9d",
                barSize: 20,
                unit: "$",
              },
              {
                type: "bar",
                dataKey: "socialSecurity",
                name: "Social Security",
                color: "#ffc658",
                barSize: 20,
                unit: "$",
              },
              {
                type: "bar",
                dataKey: "medicare",
                name: "Medicare",
                color: "#ff7300",
                barSize: 20,
                unit: "$",
              },
              {
                type: "bar",
                dataKey: "retirement",
                name: "401(k)",
                color: "#0088FE",
                barSize: 20,
                unit: "$",
              },
              {
                type: "bar",
                dataKey: "health",
                name: "Health Insurance",
                color: "#00C49F",
                barSize: 20,
                unit: "$",
              },
            ]}
            xAxisKey="date"
            title="Deductions Breakdown"
            height={400}
            tooltipFormatter={(value) => `$${Number(value).toFixed(2)}`}
          />
        )}

        {activeTab === "rates" && (
          <LineChart
            data={getFilteredData().map((item) => {
              const totalTax =
                item.federal_tax +
                item.state_tax +
                item.social_security +
                item.medicare;
              const federalRate = (item.federal_tax / item.gross_income) * 100;
              const stateRate = (item.state_tax / item.gross_income) * 100;
              const payrollRate =
                ((item.social_security + item.medicare) / item.gross_income) *
                100;
              const effectiveRate = (totalTax / item.gross_income) * 100;

              return {
                date: formatDate(item.date),
                federal: federalRate,
                state: stateRate,
                payroll: payrollRate,
                effective: effectiveRate,
                dateObj: item.date,
              };
            })}
            lines={[
              {
                dataKey: "federal",
                name: "Federal Tax Rate",
                // stroke: "#8884d8",
                unit: "%",
              },
              {
                dataKey: "state",
                name: "State Tax Rate",
                // stroke: "#82ca9d",
                unit: "%",
              },
              {
                dataKey: "payroll",
                name: "Payroll Tax Rate",
                // stroke: "#ffc658",
                unit: "%",
              },
              {
                dataKey: "effective",
                name: "Effective Tax Rate",
                // stroke: "#ff7300",
                strokeWidth: 2,
                unit: "%",
              },
            ]}
            xAxisKey="date"
            title="Tax Rates Over Time"
            height={400}
            tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
          />
        )}
      </div>
    </div>
  );
}

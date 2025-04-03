// src/features/paycheck/income-breakdown-chart.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { PieChart } from "@/components/charts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function IncomeBreakdownChart() {
  const [data, setData] = useState<Paycheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");

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
      const processedRecords = records.map((record) => ({
        ...record,
        date: new Date(record.date),
      }));

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

  // Prepare data for pie chart
  const getBreakdownData = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return [];

    // Calculate total for each category
    // const totalGross = filteredData.reduce(
    //   (sum, item) => sum + item.gross_income,
    //   0
    // );
    const totalFederalTax = filteredData.reduce(
      (sum, item) => sum + item.federal_tax,
      0
    );
    const totalStateTax = filteredData.reduce(
      (sum, item) => sum + item.state_tax,
      0
    );
    const totalSocialSecurity = filteredData.reduce(
      (sum, item) => sum + item.social_security,
      0
    );
    const totalMedicare = filteredData.reduce(
      (sum, item) => sum + item.medicare,
      0
    );
    const total401k = filteredData.reduce(
      (sum, item) => sum + item.retirement_401k,
      0
    );
    const totalHealthInsurance = filteredData.reduce(
      (sum, item) => sum + item.health_insurance,
      0
    );
    const totalDentalInsurance = filteredData.reduce(
      (sum, item) => sum + item.dental_insurance,
      0
    );
    const totalVisionInsurance = filteredData.reduce(
      (sum, item) => sum + item.vision_insurance,
      0
    );
    const totalOtherDeductions = filteredData.reduce(
      (sum, item) => sum + item.other_deductions,
      0
    );
    const totalNetIncome = filteredData.reduce(
      (sum, item) => sum + item.net_income,
      0
    );

    return [
      { name: "Federal Tax", value: totalFederalTax },
      { name: "State Tax", value: totalStateTax },
      { name: "Social Security", value: totalSocialSecurity },
      { name: "Medicare", value: totalMedicare },
      { name: "401(k)", value: total401k },
      { name: "Health Insurance", value: totalHealthInsurance },
      { name: "Dental Insurance", value: totalDentalInsurance },
      { name: "Vision Insurance", value: totalVisionInsurance },
      { name: "Other Deductions", value: totalOtherDeductions },
      { name: "Net Income", value: totalNetIncome },
    ];
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
        <h3 className="text-lg font-medium">Income Breakdown</h3>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={getBreakdownData()}
              pieConfig={{
                dataKey: "value",
                nameKey: "name",
                outerRadius: 120,
                label: ({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`,
              }}
              height={350}
              valueUnit="$"
              tooltipFormatter={(value) => `$${value.toFixed(2)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredData().length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Gross Income:</span>
                    <span>
                      $
                      {getFilteredData()
                        .reduce((sum, item) => sum + item.gross_income, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Net Income:</span>
                    <span>
                      $
                      {getFilteredData()
                        .reduce((sum, item) => sum + item.net_income, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Tax Paid:</span>
                    <span>
                      $
                      {getFilteredData()
                        .reduce(
                          (sum, item) =>
                            sum +
                            item.federal_tax +
                            item.state_tax +
                            item.social_security +
                            item.medicare,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Average Gross Income:</span>
                    <span>
                      $
                      {(
                        getFilteredData().reduce(
                          (sum, item) => sum + item.gross_income,
                          0
                        ) / getFilteredData().length
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Average Net Income:</span>
                    <span>
                      $
                      {(
                        getFilteredData().reduce(
                          (sum, item) => sum + item.net_income,
                          0
                        ) / getFilteredData().length
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Effective Tax Rate:</span>
                    <span>
                      {(
                        (getFilteredData().reduce(
                          (sum, item) =>
                            sum +
                            item.federal_tax +
                            item.state_tax +
                            item.social_security +
                            item.medicare,
                          0
                        ) /
                          getFilteredData().reduce(
                            (sum, item) => sum + item.gross_income,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

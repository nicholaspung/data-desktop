// src/routes/paychecks.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { FileSpreadsheet, BarChart, PieChart } from "lucide-react";
import GenericDataPage from "@/components/data-page/generic-data-page";
import { Card, CardContent } from "@/components/ui/card";

// Import or create these components as needed
import IncomeBreakdownChart from "@/features/paycheck/income-breakdown-chart";
import IncomeOverTimeChart from "@/features/paycheck/income-over-time-chart";

export const Route = createFileRoute("/paychecks")({
  component: PaychecksPage,
});

export default function PaychecksPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const paycheckFields = getDatasetFields("paycheck");
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <GenericDataPage
      datasetId="paycheck"
      fields={paycheckFields}
      title="Income Tracking"
      description="Track and analyze your paychecks and income sources over time."
      addLabel="Add Paycheck"
      defaultTab="income-breakdown"
      onDataChange={handleDataChange}
      customTabs={[
        {
          id: "income-breakdown",
          label: "Income Breakdown",
          icon: <PieChart className="h-4 w-4" />,
          content: (
            <Card>
              <CardContent className="pt-6">
                <IncomeBreakdownChart key={`breakdown-${refreshKey}`} />
              </CardContent>
            </Card>
          ),
          position: "before",
        },
        {
          id: "trends",
          label: "Income Trends",
          icon: <BarChart className="h-4 w-4" />,
          content: (
            <Card>
              <CardContent className="pt-6">
                <IncomeOverTimeChart key={`trends-${refreshKey}`} />
              </CardContent>
            </Card>
          ),
          position: "before",
        },
        {
          id: "tax-analysis",
          label: "Tax Analysis",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          content: (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Tax Analysis</h3>
                <p className="text-muted-foreground">
                  This page would show a detailed breakdown of your tax
                  withholdings and rates over time.
                </p>
                {/* Tax analysis visualization components would go here */}
              </CardContent>
            </Card>
          ),
          position: "after", // This tab will appear after the standard tabs
        },
      ]}
    />
  );
}

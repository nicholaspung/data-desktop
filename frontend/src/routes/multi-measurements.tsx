import { createFileRoute } from "@tanstack/react-router";
import { FeatureLayout, FeatureHeader, HelpSidebar } from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import MultiMeasurementChart from "@/components/charts/multi-measurement-chart";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/multi-measurements")({
  component: MultiMeasurementsPage,
});

function MultiMeasurementsPage() {
  const guideContent = [
    {
      title: "Getting Started",
      content: "The multi-measurement chart allows you to visualize multiple health metrics on a single graph. Use the 'Measurements' button to select which metrics to display and compare trends over time."
    },
    {
      title: "Selecting Measurements",
      content: "Click the 'Measurements' button to open the selection panel. Check the boxes next to the metrics you want to compare. Each measurement type has a different color and shows the number of data points available."
    },
    {
      title: "Time Range Filtering",
      content: "Use the time range selector to focus on specific periods. Choose from preset ranges (3 months, 6 months, 1 year, 2 years) or select a custom date range to analyze specific time periods."
    },
    {
      title: "Understanding the Chart",
      content: "Each line represents a different measurement type with its own scale and units. Hover over data points to see exact values and dates. Different measurement types may have different units, so focus on trends rather than absolute comparisons."
    }
  ];

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Multi-Measurement Trends"
          description="Compare multiple health and fitness metrics on a unified timeline"
          helpText="Visualize and compare different measurements like weight, body fat, DEXA scan results, daily metrics, and more to identify patterns and correlations in your health data."
          guideContent={guideContent}
          storageKey="multi-measurements-feature"
        >
          <TrendingUp className="h-6 w-6" />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar>
          <CompactInfoPanel
            title="Quick Tips"
            variant="tip"
            defaultExpanded={true}
            storageKey="multi-measurements-quick-tips"
          >
            **Compare Trends:** Look for patterns and correlations between different measurements over time.
            
            **Color Coding:** Each measurement has a unique color for easy identification on the chart.
            
            **Time Filtering:** Use date ranges to focus on specific periods of interest.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Available Measurements"
            variant="info"
            defaultExpanded={false}
            storageKey="multi-measurements-types"
          >
            **Body Measurements:** Weight, waist, chest, and other body dimensions
            
            **DEXA Scans:** Body fat percentage, lean mass, bone density
            
            **Daily Metrics:** Steps, heart rate, sleep, and custom tracked metrics
            
            **Bloodwork:** Laboratory values and biomarkers (when linked to dates)
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Best Practices"
            variant="warning"
            defaultExpanded={false}
            storageKey="multi-measurements-best-practices"
          >
            **Focus on Trends:** Look at long-term patterns rather than daily fluctuations.
            
            **Consistent Units:** Ensure measurements use consistent units for accurate trend analysis.
            
            **Data Quality:** More data points provide better trend visualization.
            
            **Correlation Analysis:** Look for relationships between different metrics over time.
          </CompactInfoPanel>
        </HelpSidebar>
      }
    >
      <div className="space-y-6">
        <MultiMeasurementChart />
      </div>
    </FeatureLayout>
  );
}
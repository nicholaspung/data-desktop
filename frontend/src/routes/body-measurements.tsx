import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureLayout,
  FeatureHeader,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import BodyMeasurementsDashboardSummary from "@/features/dashboard/body-measurements-dashboard-summary";
import BodyweightChart from "@/features/body-measurements/bodyweight-chart";
import MultiMeasurementChart from "@/components/charts/multi-measurement-chart";

export const Route = createFileRoute("/body-measurements")({
  component: BodyMeasurementsPage,
});

function BodyMeasurementsPage() {
  const guideContent = [
    {
      title: "Getting Started",
      content:
        "Begin by recording your first measurement. Choose a measurement type (like 'weight', 'waist', 'chest', etc.), enter the value and unit, and save. Your measurements will be tracked over time.",
    },
    {
      title: "Measurement Types",
      content:
        "You can track any type of body measurement: weight, waist circumference, chest, arm circumference, body fat percentage, muscle mass, and more. Each type is tracked separately with its own history.",
    },
    {
      title: "Best Practices",
      content:
        "For accurate tracking: measure at the same time of day, use consistent measurement techniques, record measurements regularly (daily for weight, weekly/monthly for other measurements), and use the same units consistently.",
    },
    {
      title: "Viewing Progress",
      content:
        "The dashboard shows your latest measurements and tracks how long since each type was last updated. Use this to maintain consistent tracking habits and monitor your progress over time.",
    },
  ];

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Body Measurements"
          description="Track your body measurements and physical progress over time"
          helpText="Start by adding your first measurement. You can track weight, body dimensions, body composition, and any other numeric measurements you want to monitor."
          guideContent={guideContent}
          storageKey="body-measurements-feature"
        ></FeatureHeader>
      }
      sidebar={
        <HelpSidebar>
          <CompactInfoPanel
            title="Quick Tips"
            variant="tip"
            defaultExpanded={true}
            storageKey="body-measurements-quick-tips"
          >
            **Consistent Timing:** Weigh yourself at the same time each day for
            accurate trends. **Track Progress:** Look for trends over weeks, not
            daily fluctuations. **Multiple Metrics:** Track various measurements
            for a complete picture of your progress.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Common Measurements"
            variant="info"
            defaultExpanded={false}
            storageKey="body-measurements-measurement-types"
          >
            **Weight:** Daily tracking (lbs/kg) **Waist:** At narrowest point
            (inches/cm) **Chest:** At widest point (inches/cm) **Arms:** Bicep
            circumference (inches/cm) **Thighs:** Largest circumference
            (inches/cm) **Body Fat:** Percentage (%) **Muscle Mass:** Weight or
            percentage
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Best Practices"
            variant="warning"
            defaultExpanded={false}
            storageKey="body-measurements-best-practices"
          >
            **Same Conditions:** Always measure under similar conditions (time
            of day, clothing, etc.) **Regular Schedule:** Establish a consistent
            measurement routine. **Proper Technique:** Use correct posture and
            positioning for body measurements. **Record Immediately:** Log
            measurements right after taking them to avoid forgetting.
          </CompactInfoPanel>
        </HelpSidebar>
      }
    >
      <div className="space-y-6">
        <BodyMeasurementsDashboardSummary />
        <MultiMeasurementChart />
        <BodyweightChart />
      </div>
    </FeatureLayout>
  );
}

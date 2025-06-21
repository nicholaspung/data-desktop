import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureLayout,
  FeatureHeader,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import BodyMeasurementsOverview from "@/features/body-measurements/body-measurements-overview";
import BodyweightChart from "@/features/body-measurements/bodyweight-chart";
import MultiMeasurementChart from "@/components/charts/multi-measurement-chart";
import BodyMeasurementsVisualization from "@/features/body-measurements/body-measurements-visualization";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { BodyMeasurementRecord } from "@/features/body-measurements/types";
import { FEATURE_ICONS } from "@/lib/icons";
import BodyMeasurementManager from "@/features/body-measurements/body-measurement-manager";
import PrivateToggleButton from "@/components/reusable/private-toggle-button";
import { useState, useMemo } from "react";
import { Scale, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/body-measurements")({
  component: BodyMeasurementsPage,
});

function BodyMeasurementsPage() {
  const data = useStore(dataStore, (state) => state.body_measurements) || [];
  const typedData = data as BodyMeasurementRecord[];
  const [showPrivate, setShowPrivate] = useState(false);

  const filteredData = useMemo(() => {
    if (showPrivate) {
      return typedData;
    } else {
      return typedData.filter((record) => !record.private);
    }
  }, [typedData, showPrivate]);

  const guideContent = [
    {
      title: "Getting Started",
      content:
        "Click 'Add Measurement' to record your first body measurement. Choose a measurement type (weight, waist, chest, etc.), enter the value and unit, and optionally mark it as private. Your measurements will be visualized on an interactive body diagram and tracked over time with comprehensive charts.",
    },
    {
      title: "Privacy & Data Control",
      content:
        "Mark sensitive measurements as private to keep them secure. Use the 'Show Private' toggle to view all data when needed (requires PIN if configured). Private measurements are completely hidden unless explicitly unlocked, giving you full control over your data visibility.",
    },
    {
      title: "Interactive Visualization",
      content:
        "The body diagram shows measurement locations with interactive dots. Hover over any body part to see latest measurements and trends. The visualization supports both single-date view and date comparison mode with change indicators using green (increase) and red (decrease) arrows.",
    },
    {
      title: "Advanced Analysis",
      content:
        "Compare measurements between dates, filter which measurements to include in sum calculations, and view comprehensive trends. The multi-measurement chart lets you overlay different body metrics over time with customizable date ranges and scrollable measurement filters.",
    },
    {
      title: "Best Practices",
      content:
        "For accurate tracking: measure at the same time of day, use consistent measurement techniques, record measurements regularly (daily for weight, weekly/monthly for others), and use the same units consistently. Take advantage of the date comparison feature to track progress over specific time periods.",
    },
  ];

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <FEATURE_ICONS.BAR_CHART_3 className="h-4 w-4" />,
      content: (
        <BodyMeasurementsOverview
          data={filteredData}
          showAllTypes={true}
          showSearchBar={true}
        />
      ),
    },
    {
      id: "body-visualization",
      label: "Body Measurements",
      icon: <FEATURE_ICONS.USER className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <BodyMeasurementsVisualization data={filteredData} />
        </div>
      ),
    },
    {
      id: "trends",
      label: "Trends & Charts",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <MultiMeasurementChart bodyMeasurementsData={filteredData} />
        </div>
      ),
    },
    {
      id: "weight-trends",
      label: "Weight Trends",
      icon: <Scale className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <BodyweightChart data={filteredData} />
        </div>
      ),
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
        >
          <div className="flex items-center gap-2">
            <PrivateToggleButton
              showPrivate={showPrivate}
              onToggle={setShowPrivate}
            />
            <BodyMeasurementManager />
          </div>
        </FeatureHeader>
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
      <ReusableTabs
        tabs={tabs}
        defaultTabId="overview"
        className="space-y-6"
        tabsContentClassName="mt-6"
      />
    </FeatureLayout>
  );
}

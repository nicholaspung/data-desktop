import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { InfoPanel, CompactInfoPanel } from "@/components/reusable/info-panel";
import AddCategoryDialog from "@/features/daily-tracker/add-category-dialog";
import AddMetricModal from "@/features/daily-tracker/add-metric-modal";
import QuickMetricLogger from "@/features/daily-tracker/quick-metric-logger";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Tag, PlusSquare, List, Grid } from "lucide-react";

export const Route = createFileRoute("/metric")({
  component: MetricInfoPage,
});

function MetricInfoPage() {
  const metricLoggerGuideContent = [
    {
      title: "Getting Started",
      content: `
## Quick Metric Logger Overview

The Quick Metric Logger provides a flexible way to log metrics on demand, outside of your regular daily tracking schedule. Key features include:

- Log any metric at any time, even ones hidden from daily tracking
- Manage your metrics (edit properties, delete, or hide from daily view)
- Switch between card and list views for different visualization options
- Search and filter to quickly find the metrics you need
      `,
    },
    {
      title: "Managing Metrics",
      content: `
## Creating and Organizing Metrics

For best results with the Quick Metric Logger:

1. **Create categories first** to organize your metrics
2. **Create metrics** and assign them to appropriate categories
3. **Configure visibility settings** (show in daily tracking or only in quick logger)
4. **Set frequency settings** for metrics that don't need daily tracking
      `,
    },
    {
      title: "Advanced Features",
      content: `
## Special Use Cases

The Quick Metric Logger excels at tracking infrequent events:

- **Occasional activities** (haircuts, car maintenance, etc.)
- **Irregular measurements** (weight, blood pressure, etc.)
- **One-time events** that you still want to record
- **Administrative tasks** like editing metric properties or archiving old metrics

Use the calendar toggle to control which metrics appear in your daily tracking view.
      `,
    },
  ];

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Quick Metric Logger"
          description="Log and manage metrics on-demand, regardless of schedule"
          guideContent={metricLoggerGuideContent}
          storageKey="quick-metric-logger"
        >
          <AddMetricModal buttonLabel="Add Metric" />
          <AddCategoryDialog />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="Using Quick Metric Logger">
          <CompactInfoPanel
            title="What is this feature?"
            variant="info"
            storageKey="quick-metric-logger-what-is-this-feature"
          >
            The Quick Metric Logger provides an alternative way to log and
            manage your metrics outside the daily tracking calendar. It's
            perfect for occasional events and metric administration.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Getting Started"
            variant="tip"
            storageKey="quick-metric-logger-getting-started"
          >
            <ol>
              <li>
                1. First, create categories using{" "}
                <Tag className="inline h-3 w-3" /> Add Category
              </li>
              <li>
                2. Then add metrics with{" "}
                <PlusSquare className="inline h-3 w-3" /> Add Metric
              </li>
              <li>
                3. Toggle visibility with{" "}
                <CalendarDays className="inline h-3 w-3" /> to hide from daily
                view
              </li>
              <li>
                4. Switch between <List className="inline h-3 w-3" /> or{" "}
                <Grid className="inline h-3 w-3" /> views as needed
              </li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Pro Tip"
            variant="warning"
            storageKey="quick-metric-logger-pro-tip"
          >
            For infrequent events (like haircuts or annual check-ups), create
            the metric, then disable it from daily tracking. This keeps your
            daily view clean while still allowing you to log these events when
            they happen.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <div className="space-y-6">
        <InfoPanel
          title="About Quick Metric Logger"
          variant="info"
          defaultExpanded={true}
          storageKey="quick-metric-logger-about"
        >
          <p className="mb-2">
            The Quick Metric Logger connects to the metrics you create for daily
            tracking but extends their functionality. Here you can:
          </p>

          <ul className="space-y-2 mb-4">
            <li>• Log metrics at any time, regardless of schedule</li>
            <li>• Modify metric properties or delete metrics</li>
            <li>• Hide metrics from your daily tracking view</li>
            <li>• Organize metrics into categories for better management</li>
            <li>
              • Switch between card and list views for different visual needs
            </li>
          </ul>

          <p className="mb-2">
            <strong>Perfect for infrequent events:</strong> Create metrics for
            things you don't track daily (like haircuts, home maintenance, or
            annual check-ups). Disable them from the daily view using the
            calendar icon, then use this page to log them when they occur.
          </p>

          <p>
            <strong>Getting started:</strong> Create categories first, then add
            metrics and assign them to categories. Use the search function to
            quickly find any metric when you need to log it.
          </p>
        </InfoPanel>

        <QuickMetricLogger />
      </div>
    </FeatureLayout>
  );
}

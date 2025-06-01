import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import CalendarView from "@/features/daily-tracker/calendar-view";
import { Metric } from "@/store/experiment-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter } from "lucide-react";

export const Route = createFileRoute("/metric-calendar")({
  component: MetricCalendarPage,
});

function MetricCalendarPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  const metricsByCategory = metrics.reduce(
    (grouped: Record<string, Metric[]>, metric) => {
      if (!metric.active) return grouped;

      const categoryId = metric.category_id;
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || "Uncategorized";

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      grouped[categoryName].push(metric);
      return grouped;
    },
    {}
  );

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    );
  };

  const selectCategory = (categoryName: string, selected: boolean) => {
    const categoryMetrics = metricsByCategory[categoryName] || [];
    const categoryMetricIds = categoryMetrics.map((m) => m.id);

    if (selected) {
      setSelectedMetrics((prev) => [
        ...prev.filter((id) => !categoryMetricIds.includes(id)),
        ...categoryMetricIds,
      ]);
    } else {
      setSelectedMetrics((prev) =>
        prev.filter((id) => !categoryMetricIds.includes(id))
      );
    }
  };

  const isCategorySelected = (categoryName: string) => {
    const categoryMetrics = metricsByCategory[categoryName] || [];
    return (
      categoryMetrics.length > 0 &&
      categoryMetrics.every((m) => selectedMetrics.includes(m.id))
    );
  };

  const metricCalendarGuideContent = [
    {
      title: "Using the Metric Calendar",
      content: `
## Viewing Your Metrics in Calendar Format

The Metric Calendar provides a visual way to track your metrics over time. It allows you to:

- See all your logged metrics in a monthly calendar view
- Identify patterns and trends in your metric completion
- Compare multiple metrics side by side
- View detailed information for any specific day
      `,
    },
    {
      title: "Selecting Metrics",
      content: `
## Choosing Which Metrics to Display

From the selector panel on the left:

1. **Select individual metrics** by checking their boxes
2. **Select entire categories** to include all metrics in that category
3. **Clear your selection** to start over
4. **Mix and match metrics** from different categories to see correlations

You can select as many metrics as you want to view at once. For the clearest visualization, try selecting related metrics that you want to track together.
      `,
    },
    {
      title: "Reading the Calendar",
      content: `
## Understanding the Calendar Display

Each day on the calendar shows:

- **Metric counts**: The total number of metrics logged that day
- **Completion badges**: Shows how many boolean metrics were completed
- **Metric previews**: Names of the first few logged metrics
- **Current day**: Highlighted with a colored circle
- **Days with logs**: Highlighted with a colored border

Click on any day to see full details about all metrics logged for that date.
      `,
    },
    {
      title: "Tips & Tricks",
      content: `
## Making the Most of the Calendar View

Here are some helpful ways to use this feature:

- **Track habits**: Select all your daily habits to see completion patterns
- **Monitor goals**: Group metrics related to a specific goal
- **Identify correlations**: Compare related metrics to see how they affect each other
- **Analyze experiments**: View experiment-related metrics for the duration of an experiment
- **Find gaps**: Quickly identify days where you missed logging important metrics

The calendar view works best when you're consistent in logging your metrics each day.
      `,
    },
  ];

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Metric Calendar"
          description="View your metrics and daily logs in a calendar format"
          guideContent={metricCalendarGuideContent}
          storageKey="metric-calendar-page"
        />
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar with metric selection */}
        <div className="lg:w-1/3">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Select Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(metricsByCategory).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No active metrics found. Please add metrics first.
                </p>
              ) : (
                <div className="flex flex-col h-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMetrics([])}
                    className="mb-4 self-end"
                  >
                    Clear Selection
                  </Button>

                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="space-y-6 pr-4">
                      {Object.entries(metricsByCategory).map(
                        ([category, categoryMetrics]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`category-${category}`}
                                checked={isCategorySelected(category)}
                                onCheckedChange={(checked) =>
                                  selectCategory(category, !!checked)
                                }
                              />
                              <Label
                                htmlFor={`category-${category}`}
                                className="font-medium"
                              >
                                {category} ({categoryMetrics.length})
                              </Label>
                            </div>

                            <div className="ml-6 space-y-1">
                              {categoryMetrics.map((metric) => (
                                <div
                                  key={metric.id}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox
                                    id={`metric-${metric.id}`}
                                    checked={selectedMetrics.includes(
                                      metric.id
                                    )}
                                    onCheckedChange={() =>
                                      toggleMetric(metric.id)
                                    }
                                  />
                                  <Label
                                    htmlFor={`metric-${metric.id}`}
                                    className="text-sm"
                                  >
                                    {metric.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side calendar view */}
        <div className="lg:w-2/3">
          {selectedMetrics.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Calendar View
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-10">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Please select at least one metric from the panel on the left
                  to view on the calendar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <CalendarView selectedMetrics={selectedMetrics} />
          )}
        </div>
      </div>
    </FeatureLayout>
  );
}

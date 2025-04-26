import { useState } from "react";
import { COLORS, formatDate } from "@/lib/date-utils";
import { ComparisonSelector } from "./comparison-selector";
import { format } from "date-fns";
import { ViewMode } from "../dexa";
import CustomLineChart from "@/components/charts/line-chart";
import CustomRadarChart from "@/components/charts/radar-chart";
import CustomBarChart from "@/components/charts/bar-chart";
import { DEXAScan } from "@/store/dexa-definitions";
import ReusableTabs from "@/components/reusable/reusable-tabs";

const RegionalAnalysisTab = ({ data }: { data: DEXAScan[] }) => {
  const [activeTab, setActiveTab] = useState("percentage");
  const [selectedScan, setSelectedScan] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [primaryDate, setPrimaryDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  const percentageMetrics = [
    { key: "arms_total_region_fat_percentage", name: "Arms" },
    { key: "legs_total_region_fat_percentage", name: "Legs" },
    { key: "trunk_total_region_fat_percentage", name: "Trunk" },
    { key: "android_total_region_fat_percentage", name: "Android" },
    { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
  ];

  const absoluteMetrics = [
    { key: "arms_fat_tissue_lbs", name: "Arms Fat" },
    { key: "legs_fat_tissue_lbs", name: "Legs Fat" },
    { key: "trunk_fat_tissue_lbs", name: "Trunk Fat" },
    { key: "android_fat_tissue_lbs", name: "Android Fat" },
    { key: "gynoid_fat_tissue_lbs", name: "Gynoid Fat" },
  ];

  const leanMassMetrics = [
    { key: "arms_lean_tissue_lbs", name: "Arms Lean" },
    { key: "legs_lean_tissue_lbs", name: "Legs Lean" },
    { key: "trunk_lean_tissue_lbs", name: "Trunk Lean" },
  ];

  const dateOptions = data
    .map((scan) => ({
      value: scan.id,
      label: formatDate(scan.date),
      date: new Date(scan.date),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const primaryScan = data.find((scan) => scan.id === primaryDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  if (dateOptions.length > 0) {
    if (!selectedScan) {
      setSelectedScan(dateOptions[0].value ?? "");
    }
    if (!primaryDate) {
      setPrimaryDate(dateOptions[0].value ?? "");
    }
    if (!comparisonDate && dateOptions.length > 1) {
      setComparisonDate(dateOptions[1].value ?? "");
    }
  }

  const getPercentageComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        percentageMetrics.forEach((metric) => {
          result[metric.name] =
            (item[metric.key as keyof DEXAScan] as number) * 100 || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const getAbsoluteComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        absoluteMetrics.forEach((metric) => {
          result[metric.name] =
            (item[metric.key as keyof DEXAScan] as number) || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const getLeanMassComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        leanMassMetrics.forEach((metric) => {
          result[metric.name] =
            (item[metric.key as keyof DEXAScan] as number) || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const getScanDataForRadar = (scan: DEXAScan | undefined) => {
    if (!scan) return [];

    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        subject: metric.name,
        value: (scan[metric.key as keyof DEXAScan] as number) * 100 || 0,
        fullMark: 40,
      }));
    }

    if (activeTab === "absolute") {
      return [...absoluteMetrics, ...leanMassMetrics].map((metric) => ({
        subject: metric.name,
        value: (scan[metric.key as keyof DEXAScan] as number) || 0,
        fullMark:
          Math.max(
            ...data.map((s) => (s[metric.key as keyof DEXAScan] as number) || 0)
          ) * 1.2,
      }));
    }

    return [];
  };

  const getComparisonRadarData = () => {
    if (!primaryScan || !comparisonScan) return [];

    const primaryLabel = format(new Date(primaryScan.date), "MMM d, yyyy");
    const comparisonLabel = format(
      new Date(comparisonScan.date),
      "MMM d, yyyy"
    );

    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        subject: metric.name,
        [primaryLabel]:
          (primaryScan[metric.key as keyof DEXAScan] as number) * 100 || 0,
        [comparisonLabel]:
          (comparisonScan[metric.key as keyof DEXAScan] as number) * 100 || 0,
      }));
    }

    if (activeTab === "absolute") {
      return [...absoluteMetrics, ...leanMassMetrics].map((metric) => ({
        subject: metric.name,
        [primaryLabel]:
          (primaryScan[metric.key as keyof DEXAScan] as number) || 0,
        [comparisonLabel]:
          (comparisonScan[metric.key as keyof DEXAScan] as number) || 0,
      }));
    }

    return [];
  };

  const getBarChartComparisonData = () => {
    if (!primaryScan || !comparisonScan) return [];

    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        name: metric.name,
        Primary:
          (primaryScan[metric.key as keyof DEXAScan] as number) * 100 || 0,
        Comparison:
          (comparisonScan[metric.key as keyof DEXAScan] as number) * 100 || 0,
      }));
    }

    if (activeTab === "absolute") {
      const metrics = [...absoluteMetrics, ...leanMassMetrics];
      return metrics.map((metric) => ({
        name: metric.name,
        Primary: (primaryScan[metric.key as keyof DEXAScan] as number) || 0,
        Comparison:
          (comparisonScan[metric.key as keyof DEXAScan] as number) || 0,
      }));
    }

    return [];
  };

  const getPercentageLineConfigs = () => {
    return percentageMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[index % COLORS.length],
      unit: "%",
    }));
  };

  const getAbsoluteLineConfigs = () => {
    return absoluteMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[index % COLORS.length],
      unit: " lbs",
    }));
  };

  const getLeanMassLineConfigs = () => {
    return leanMassMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[(index + 5) % COLORS.length],
      unit: " lbs",
    }));
  };

  const tooltipFormatter = (value: any, name: string) => {
    const displayValue = Number(value).toFixed(2);
    if (activeTab === "percentage" || name.includes("%")) {
      return `${displayValue}%`;
    }
    return `${displayValue} lbs`;
  };

  const getRadarComparisonConfigs = () => {
    if (!primaryScan || !comparisonScan) return [];

    const primaryLabel = format(new Date(primaryScan.date), "MMM d, yyyy");
    const comparisonLabel = format(
      new Date(comparisonScan.date),
      "MMM d, yyyy"
    );

    return [
      {
        dataKey: primaryLabel,
        name: primaryLabel,
        fill: "#8884d8",
        stroke: "#8884d8",
        fillOpacity: 0.6,
      },
      {
        dataKey: comparisonLabel,
        name: comparisonLabel,
        fill: "#82ca9d",
        stroke: "#82ca9d",
        fillOpacity: 0.6,
      },
    ];
  };

  const getCurrentScanBars = () => {
    return [
      {
        dataKey: "value",
        name: activeTab === "percentage" ? "Fat %" : "Mass",
        fill: activeTab === "percentage" ? "#8884d8" : "#82ca9d",
      },
    ];
  };

  const getComparisonBars = () => {
    return [
      {
        dataKey: "Primary",
        name: "Primary",
        fill: "#8884d8",
      },
      {
        dataKey: "Comparison",
        name: "Comparison",
        fill: "#82ca9d",
      },
    ];
  };

  return (
    <div className="space-y-6">
      <ReusableTabs
        tabs={[
          {
            id: "percentage",
            label: "Fat Percentage",
            content: (
              <div className="mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <CustomLineChart
                    data={getPercentageComparisonData()}
                    lines={getPercentageLineConfigs()}
                    xAxisKey="date"
                    yAxisUnit="%"
                    title="Regional Fat Percentage Comparison"
                    height={400}
                    tooltipFormatter={tooltipFormatter}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <ComparisonSelector
                      data={data}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      selectedDate={primaryDate}
                      comparisonDate={comparisonDate}
                      onSelectedDateChange={setPrimaryDate}
                      onComparisonDateChange={setComparisonDate}
                    />
                  </div>
                  {viewMode === "single" ? (
                    <>
                      <CustomRadarChart
                        data={getScanDataForRadar(primaryScan)}
                        radars={[
                          {
                            dataKey: "value",
                            name: "Fat %",
                            fill: "#8884d8",
                            stroke: "#8884d8",
                            fillOpacity: 0.6,
                          },
                        ]}
                        title="Current Distribution"
                        height={300}
                        outerRadius={90}
                        tooltipFormatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                      <CustomBarChart
                        data={getScanDataForRadar(primaryScan)}
                        bars={getCurrentScanBars()}
                        xAxisKey="subject"
                        yAxisUnit="%"
                        title="Region Comparison"
                        height={300}
                        tooltipFormatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                    </>
                  ) : (
                    <>
                      <CustomRadarChart
                        data={getComparisonRadarData()}
                        radars={getRadarComparisonConfigs()}
                        title="Distribution Comparison"
                        height={300}
                        outerRadius={90}
                        tooltipFormatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                      <CustomBarChart
                        data={getBarChartComparisonData()}
                        bars={getComparisonBars()}
                        xAxisKey="name"
                        yAxisUnit="%"
                        title="Region Comparison"
                        height={300}
                        tooltipFormatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            ),
          },
          {
            id: "absolute",
            label: "Mass Distribution",
            content: (
              <div className="mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <CustomLineChart
                    data={getAbsoluteComparisonData()}
                    lines={getAbsoluteLineConfigs()}
                    xAxisKey="date"
                    yAxisUnit=" lbs"
                    title="Fat Tissue Distribution (lbs)"
                    height={400}
                    tooltipFormatter={tooltipFormatter}
                    className="md:col-span-2"
                  />
                  <CustomLineChart
                    data={getLeanMassComparisonData()}
                    lines={getLeanMassLineConfigs()}
                    xAxisKey="date"
                    yAxisUnit=" lbs"
                    title="Lean Tissue Distribution (lbs)"
                    height={400}
                    tooltipFormatter={tooltipFormatter}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <ComparisonSelector
                      data={data}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      selectedDate={primaryDate}
                      comparisonDate={comparisonDate}
                      onSelectedDateChange={setPrimaryDate}
                      onComparisonDateChange={setComparisonDate}
                    />
                  </div>
                  {viewMode === "single" ? (
                    <CustomBarChart
                      data={getScanDataForRadar(primaryScan)}
                      bars={getCurrentScanBars()}
                      xAxisKey="subject"
                      yAxisUnit=" lbs"
                      title="Current Distribution (lbs)"
                      height={300}
                      tooltipFormatter={(value) =>
                        `${Number(value).toFixed(2)} lbs`
                      }
                      className="md:col-span-2"
                    />
                  ) : (
                    <CustomBarChart
                      data={getBarChartComparisonData()}
                      bars={getComparisonBars()}
                      xAxisKey="name"
                      yAxisUnit=" lbs"
                      title="Distribution Comparison (lbs)"
                      height={300}
                      tooltipFormatter={(value) =>
                        `${Number(value).toFixed(2)} lbs`
                      }
                      className="md:col-span-2"
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
        defaultTabId={activeTab}
        onChange={setActiveTab}
        className="w-full"
        tabsListClassName="grid w-full md:w-[400px] grid-cols-2"
        tabsContentClassName=""
      />
    </div>
  );
};

export default RegionalAnalysisTab;

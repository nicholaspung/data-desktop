import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import { DEXAScan } from "@/store/dexa-definitions";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { FEATURE_ICONS } from "@/lib/icons";
import { PieChart } from "lucide-react";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function DEXADashboardSummary() {
  const dexaData = useStore(dataStore, (state) => state.dexa) || [];
  const [loading, setLoading] = useState(true);
  const [latestScan, setLatestScan] = useState<DEXAScan | null>(null);

  useEffect(() => {
    const sortedScans = [...dexaData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedScans.length > 0) {
      setLatestScan(sortedScans[0]);
    }

    setLoading(false);
  }, [dexaData]);

  return (
    <ReusableSummary
      title="DEXA Scan Summary"
      linkTo="/dexa"
      loading={loading}
      titleIcon={<FEATURE_ICONS.DEXA_SCAN className="h-5 w-5" />}
      emptyState={
        !latestScan
          ? {
              message: "No DEXA scan data available",
              actionText: "Add your first scan",
              actionTo: "/dexa",
            }
          : undefined
      }
      mainSection={
        latestScan
          ? {
              title: "Latest Scan",
              value: formatDate(latestScan.date),
            }
          : undefined
      }
      sections={
        latestScan
          ? [
              {
                columns: 2 as const,
                items: [
                  {
                    label: "Body Fat %",
                    value: `${(latestScan.total_body_fat_percentage * 100).toFixed(1)}%`,
                  },
                  {
                    label: "Lean Mass",
                    value: `${latestScan.lean_tissue_lbs.toFixed(1)} lbs`,
                  },
                ],
              },
              {
                columns: 2 as const,
                className: "pt-2 border-t",
                items: [
                  {
                    label: "VAT Mass",
                    value: `${latestScan.vat_mass_lbs?.toFixed(2) || "N/A"} lbs`,
                  },
                  {
                    label: "Bone Density",
                    value: `${
                      latestScan.bone_density_g_cm2_total?.toFixed(3) || "N/A"
                    } g/cm²`,
                  },
                ],
              },
              {
                className: "pt-2",
                items: [
                  {
                    label: "Android/Gynoid Ratio",
                    value: latestScan.a_g_ratio?.toFixed(2) || "N/A",
                  },
                ],
              },
            ]
          : undefined
      }
    />
  );
}

registerDashboardSummary({
  route: "/dexa",
  component: DEXADashboardSummary,
  defaultConfig: {
    id: "/dexa",
    size: "medium",
    order: 8,
    visible: true,
  },
  datasets: ["dexa"],
  name: "DEXA Scans",
  description: "Track body composition from DEXA scans",
  icon: PieChart,
});

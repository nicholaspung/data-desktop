// src/components/dashboard/dexa-summary.tsx
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import { DEXAScan } from "@/store/dexa-definitions";
import { Link } from "@tanstack/react-router";

export default function DEXADashboardSummary() {
  const dexaData = useStore(dataStore, (state) => state.dexa) || [];
  const [loading, setLoading] = useState(true);
  const [latestScan, setLatestScan] = useState<DEXAScan | null>(null);

  useEffect(() => {
    // Sort by date, newest first
    const sortedScans = [...dexaData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedScans.length > 0) {
      setLatestScan(sortedScans[0]);
    }

    setLoading(false);
  }, [dexaData]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          DEXA Scan Summary
          <Link to="/dexa" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !latestScan ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No DEXA scan data available</p>
            <Link
              to="/dexa"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Add your first scan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Latest Scan</p>
              <p className="text-xl font-semibold">
                {latestScan ? formatDate(latestScan.date) : "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Body Fat %</p>
                </div>
                <p className="text-2xl font-bold">
                  {latestScan?.total_body_fat_percentage * 100}%
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Lean Mass</p>
                </div>
                <p className="text-2xl font-bold">
                  {latestScan?.lean_tissue_lbs.toFixed(1)} lbs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">VAT Mass</p>
                <p className="font-semibold">
                  {latestScan?.vat_mass_lbs?.toFixed(2) || "N/A"} lbs
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bone Density</p>
                <p className="font-semibold">
                  {latestScan?.bone_density_g_cm2_total?.toFixed(3) || "N/A"}{" "}
                  g/cm²
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                Android/Gynoid Ratio
              </p>
              <p className="font-semibold">
                {latestScan?.a_g_ratio?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

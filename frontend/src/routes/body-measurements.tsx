import { createFileRoute } from "@tanstack/react-router";
import { FeatureLayout, FeatureHeader } from "@/components/layout/feature-layout";
import ReusableCard from "@/components/reusable/reusable-card";
import { Ruler } from "lucide-react";

export const Route = createFileRoute("/body-measurements")({
  component: BodyMeasurementsPage,
});

function BodyMeasurementsPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Body Measurements"
          description="Track your body measurements and physical progress"
          storageKey="body-measurements-feature"
        >
          <Ruler className="h-6 w-6" />
        </FeatureHeader>
      }
    >
      <div className="space-y-6">
        <ReusableCard
          title="Coming Soon"
          content={
            <div className="text-center py-8">
              <Ruler className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Body Measurements Tracking
              </h3>
              <p className="text-muted-foreground mb-4">
                This feature is under development. Soon you'll be able to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Track weight, measurements, and body metrics</li>
                <li>• Visualize progress over time with charts</li>
                <li>• Set measurement goals and targets</li>
                <li>• Export measurement data</li>
              </ul>
            </div>
          }
        />
      </div>
    </FeatureLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import BloodworkVisualizations from "@/features/bloodwork/bloodwork-visualization";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import { AddBloodworkDialog } from "@/features/bloodwork/add-bloodwork-dialog";
import BloodMarkerManager from "@/features/bloodwork/blood-marker-manager";
import BloodworkManager from "@/features/bloodwork/bloodwork-manager";
import BloodResultsManager from "@/features/bloodwork/blood-results-manager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FEATURE_ICONS } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import BloodworkCSVImport from "@/features/bloodwork/advanced-csv-import";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Bloodwork Tracker"
          description="Track and analyze your blood test results over time"
          storageKey="bloodwork-page"
        >
          <div className="flex space-x-2">
            <AddBloodworkDialog />
            <BloodworkCSVImport />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-2 flex">
                  <FEATURE_ICONS.SETTINGS className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <BloodMarkerManager />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <BloodworkManager />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <BloodResultsManager />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="Getting Started">
          <CompactInfoPanel
            title="Step 1: Get a Blood Test"
            defaultExpanded
            storageKey="bloodwork-step-1"
          >
            Obtain a blood test from your medical provider or service. This will
            provide the marker names, values and reference ranges needed.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Step 2: Add Blood Markers"
            defaultExpanded
            storageKey="bloodwork-step-2"
          >
            Click the gear icon and select "Manage Blood Markers". Add each
            marker that was tested in your blood work:
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Enter the marker name exactly as shown on your test</li>
              <li>Include the unit of measurement (mg/dL, etc.)</li>
              <li>Add the lab reference ranges for general population</li>
              <li>
                Optionally add "optimal" ranges if you follow specific
                recommendations
              </li>
            </ul>
            <strong className="block mt-2">
              This is a one-time setup for each new marker.
            </strong>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Step 3: Add Test Results"
            defaultExpanded
            storageKey="bloodwork-step-3"
          >
            Click "Add Bloodwork" and:
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Select the date of your blood test</li>
              <li>Enter the lab name (optional)</li>
              <li>Add any notes about the test</li>
              <li>Input values for each blood marker</li>
              <li>Use numeric values when possible for better visualization</li>
              <li>Submit to save your results</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Viewing & Managing Data"
            variant="tip"
            defaultExpanded
            storageKey="bloodwork-step-4"
          >
            <strong>View Results:</strong> After adding data, your test results
            will appear in the visualization section below.
            <div className="mt-2 space-y-1">
              <strong>To Edit or Delete:</strong>
              <ul className="list-disc list-inside">
                <li>
                  <strong>Blood Markers:</strong> Gear icon → Manage Blood
                  Markers
                </li>
                <li>
                  <strong>Blood Tests:</strong> Gear icon → Manage Bloodwork
                  Tests
                </li>
                <li>
                  <strong>Test Results:</strong> Gear icon → Manage Blood
                  Results
                </li>
              </ul>
            </div>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Data Privacy"
            variant="info"
            defaultExpanded
            storageKey="bloodwork-step-5"
          >
            All bloodwork data is stored locally on your computer and is never
            sent to any server.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Medical Disclaimer"
            variant="warning"
            defaultExpanded
            storageKey="bloodwork-step-6"
          >
            This application is for tracking purposes only and is not a
            substitute for medical advice. Always consult with healthcare
            professionals when interpreting your results.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <BloodworkVisualizations />
    </FeatureLayout>
  );
}

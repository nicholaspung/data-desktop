// src/routes/bloodwork.tsx
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
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

// Bloodwork guide content
const bloodworkGuideContent = [
  {
    title: "Getting Started",
    content: `
## Understanding Your Bloodwork

This feature allows you to track and analyze your blood test results over time. Here's how to get started:

1. **Import Data**: Use the CSV import feature to quickly add blood test results
2. **Add Markers**: Create blood markers with reference ranges
3. **Visualize Results**: See how your values change over time with automatic charts

For best results, make sure to include reference ranges for each marker.
    `,
  },
  {
    title: "Importing Data",
    content: `
## CSV Import Instructions

To import your bloodwork data:

1. Click the "Import CSV" button
2. Select your CSV file
3. Map the columns to the correct fields
4. Click "Import" to add the data

Your CSV should have the following columns:
- Test Date
- Marker Name
- Value
- Unit (optional)
- Reference Range (optional)

**Tip**: You can download a template CSV from the import dialog.
    `,
  },
  {
    title: "Analyzing Results",
    content: `
## Understanding Your Results

The bloodwork dashboard helps you visualize your results in several ways:

- **Status indicators**: Quickly see which markers are within optimal ranges
- **Trend charts**: Track how values change over time
- **Comparison view**: Compare multiple test dates side by side

### Color Coding

- 🟢 **Green**: Within optimal range
- 🟡 **Yellow**: Within reference range but not optimal
- 🔴 **Red**: Outside reference range

You can filter the view to focus on specific categories or statuses.
    `,
  },
];

// Example bloodwork page with help components integrated
export default function BloodworkPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Bloodwork Tracker"
          description="Track and analyze your blood test results over time"
          guideContent={bloodworkGuideContent}
          storageKey="bloodwork-page"
        >
          <div className="flex space-x-2">
            <AddBloodworkDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-2 flex">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex space-x-2">
                  <DropdownMenuItem asChild>
                    <BloodworkManager />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <BloodMarkerManager />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <BloodResultsManager />
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="Tips & Information">
          <CompactInfoPanel title="Quick Setup">
            For the best experience, start by:
            <ol>
              <li>1. Setting up your blood marker reference ranges</li>
              <li>2. Importing your historical blood test data</li>
              <li>3. Using the visualization tab to track changes over time</li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel title="Data Privacy" variant="info" defaultExpanded>
            All bloodwork data is stored locally on your computer and is never
            sent to any server.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Interpreting Results"
            variant="warning"
            defaultExpanded
          >
            This application is for tracking purposes only and is not a
            substitute for medical advice. Always consult with healthcare
            professionals.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <BloodworkVisualizations />
    </FeatureLayout>
  );
}

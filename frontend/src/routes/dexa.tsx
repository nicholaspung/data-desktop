// src/routes/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import AddDexaScanButton from "@/features/dexa/add-dexa-scan-button";
import EditDexaScanButton from "@/features/dexa/edit-dexa-scan-button";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

// Define the guide content sections
const dexaGuideContent = [
  {
    title: "Getting Started",
    content: `
## Understanding DEXA Scans

DEXA (Dual-Energy X-ray Absorptiometry) scans provide detailed information about your body composition, including:

- **Body Fat Percentage**: Total and regional body fat measurements
- **Lean Mass**: Muscle and other non-fat tissue measurements
- **Bone Density**: Measurements of bone mineral content and density
- **Regional Analysis**: Breakdown of composition by body region (arms, legs, trunk)

Use this feature to track changes in your body composition over time and monitor the effects of diet, exercise, and other interventions.
    `,
  },
  {
    title: "Adding Data",
    content: `
## Adding DEXA Scan Data

To add your DEXA scan results:

1. Click the **+ Add DEXA Scan** button in the toolbar
2. Enter the date of your scan
3. Select whether you were fasted
4. Input your scan values from your DEXA report
5. Include at minimum the essential measurements:
   - Total body fat percentage
   - Total lean mass
   - Bone mineral content
6. For more detailed tracking, add regional measurements
7. Click **Save** to store your data

For best results, take your DEXA scans under similar conditions (time of day, hydration, fasting status).
    `,
  },
  {
    title: "Editing Data",
    content: `
## Managing Your DEXA Data

### Editing Previous Scans

If you need to update a previous entry:

1. Click the **Edit DEXA Scan** button
2. Select the scan date you want to modify
3. Make your changes to the values
4. Click **Save** to update the record

### Deleting Records

To remove an incorrect entry:

1. Click the **Edit DEXA Scan** button
2. Select the scan date you want to remove
3. Click the **Delete** button at the bottom of the form
4. Confirm deletion in the prompt

All data is stored locally on your device.
    `,
  },
  {
    title: "Using Visualizations",
    content: `
## Interpreting Your Data

The visualization tabs provide different ways to analyze your DEXA results:

### Trends Over Time

The **Trends** tab shows how key metrics change between scans:
- Body composition changes (fat, lean mass, bone)
- Progress toward body composition goals
- Rate of change between measurements

### Body Composition

The **Composition** tab breaks down your body components:
- Current fat vs. lean tissue distribution
- Comparison to previous scans
- Regional analysis (arms, legs, trunk)

### Body Fat Analysis

The **Fat Distribution** tab focuses specifically on fat metrics:
- Visceral fat analysis
- Android vs. gynoid fat distribution
- Regional fat percentage comparisons

### Lean Mass Analysis

The **Lean Mass** tab highlights muscle and other lean tissue:
- Total lean tissue changes
- Regional muscle distribution
- Symmetry between left and right sides

### Bone Metrics

The **Bone Density** tab provides information about bone health:
- Total bone mineral content
- Regional bone density measurements
- Comparison to previous scans
    `,
  },
];

export default function DexaPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="DEXA Scan Tracker"
          description="Track and visualize your body composition changes over time"
          guideContent={dexaGuideContent}
          storageKey="dexa-page"
        >
          <AddDexaScanButton />
          <EditDexaScanButton />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="DEXA Scan Guide">
          <CompactInfoPanel
            title="Getting Started"
            variant="info"
            storageKey="dexa-getting-started"
          >
            To use this feature, get a DEXA scan from a clinic or facility, then
            input your data by clicking "Add DEXA Scan". Once added, the graphs
            will automatically update to visualize your body composition trends.
          </CompactInfoPanel>
          <CompactInfoPanel
            title="Essential Metrics"
            variant="tip"
            storageKey="dexa-essential-metrics"
          >
            The most important metrics to track are:
            <ul className="mt-2 ml-4 list-disc">
              <li>Total body fat percentage</li>
              <li>Lean tissue mass</li>
              <li>Visceral adipose tissue (VAT)</li>
              <li>Bone mineral density</li>
            </ul>
          </CompactInfoPanel>
          <CompactInfoPanel
            title="Managing Data"
            variant="info"
            storageKey="dexa-managing-data"
          >
            To edit a previous scan, click "Edit DEXA Scan", select the date you
            want to modify, and update the values. To delete an incorrect
            record, use the delete button in the edit dialog.
          </CompactInfoPanel>
          <CompactInfoPanel
            title="Visualization Tips"
            variant="tip"
            storageKey="dexa-visualization-tips"
          >
            <ul className="mt-2 ml-4 list-disc">
              <li>Use the tabs to view different aspects of your data</li>
              <li>Hover over chart elements to see exact values</li>
              <li>Compare scans by selecting multiple dates</li>
              <li>Track progress toward your body composition goals</li>
            </ul>
          </CompactInfoPanel>
          <CompactInfoPanel
            title="Best Practices"
            variant="warning"
            storageKey="dexa-best-practices"
          >
            For most accurate tracking, take your DEXA scans:
            <ul className="mt-2 ml-4 list-disc">
              <li>At the same time of day</li>
              <li>In a similar hydration state</li>
              <li>Consistently fasted or fed</li>
              <li>Every 3-6 months for optimal tracking</li>
            </ul>
          </CompactInfoPanel>
          <CompactInfoPanel
            title="Data Privacy"
            variant="info"
            storageKey="dexa-data-privacy"
          >
            All DEXA scan data is stored locally on your computer and is never
            sent to any server.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <DexaVisualization />
    </FeatureLayout>
  );
}

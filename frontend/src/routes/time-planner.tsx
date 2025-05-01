// src/routes/time-planner.tsx
import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import TimePlanner from "@/features/time-planner/time-planner";

export const Route = createFileRoute("/time-planner")({
  component: TimePlannerPage,
});

// Define the guide content sections
const timePlannerGuideContent = [
  {
    title: "Getting Started",
    content: `
## Weekly Time Planner Overview

The Weekly Time Planner helps you plan and visualize your schedule ahead of time. Key features include:

- Schedule blocks of time for different activities
- Organize activities with color-coded categories
- View a weekly overview of your planned time
- Get a summary of how you've allocated your time
- All data is stored locally in your browser
    `,
  },
  {
    title: "Creating Time Blocks",
    content: `
## Adding Activities to Your Schedule

To plan your week effectively:

1. **Click the + button** on any day to add a new time block
2. **Enter a title** for the activity
3. **Set start and end times** to define the duration
4. **Choose a category** or create a new one
5. **Add optional details** in the description field
6. **Save the block** to add it to your schedule

You can also edit or delete blocks after they've been created.
    `,
  },
  {
    title: "Using Categories",
    content: `
## Organizing Your Activities

Categories help you organize and analyze your planned time:

- **Create custom categories** with different colors
- **Assign categories** to each time block
- **View time summary** broken down by category
- **Analyze allocation** to see how you're spending your time
- **Identify imbalances** in your schedule

Well-organized categories make it easier to ensure balanced time allocation.
    `,
  },
  {
    title: "Weekly Planning",
    content: `
## Planning Your Week Effectively

For best results with the Weekly Time Planner:

- **Plan ahead at the start of each week**
- **Be realistic** about how long activities will take
- **Leave buffer time** between activities
- **Balance** work, personal, and rest time
- **Review and adjust** as the week progresses

Remember that this is a planning tool - your actual schedule may vary, but planning helps set intentions.
    `,
  },
];

function TimePlannerPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Weekly Time Planner"
          description="Plan and visualize your schedule for the week"
          guideContent={timePlannerGuideContent}
          storageKey="time-planner-page"
        />
      }
      sidebar={
        <HelpSidebar title="Planning Tips">
          <CompactInfoPanel
            title="Getting Started"
            variant="info"
            storageKey="time-planner-getting-started"
          >
            <ul className="mt-2 ml-4 list-disc">
              <li>Start by creating categories for different activities</li>
              <li>Plan at the beginning of each week</li>
              <li>Click the + button on any day to add a time block</li>
              <li>Review the weekly summary to ensure balanced allocation</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Effective Planning"
            variant="tip"
            storageKey="time-planner-effective-planning"
          >
            <ul className="mt-2 ml-4 list-disc">
              <li>Be realistic about how long tasks take</li>
              <li>Include buffer time between activities</li>
              <li>Block focused work time without interruptions</li>
              <li>Schedule breaks and personal time</li>
              <li>Group similar activities together when possible</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Time Management"
            variant="tip"
            storageKey="time-planner-time-management"
          >
            <p>Aim for a balanced allocation:</p>
            <ul className="mt-2 ml-4 list-disc">
              <li>~40% for focused work/primary responsibilities</li>
              <li>~20% for meetings and collaboration</li>
              <li>~15% for learning and development</li>
              <li>~15% for health and personal activities</li>
              <li>~10% buffer for unexpected issues</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Data Storage"
            variant="info"
            storageKey="time-planner-data-storage"
          >
            All time blocks and categories are stored locally in your browser's
            localStorage. The data doesn't sync between devices and isn't sent
            to any server.
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <TimePlanner />
    </FeatureLayout>
  );
}

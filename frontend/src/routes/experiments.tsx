import { createFileRoute } from "@tanstack/react-router";
import ExperimentList from "@/features/experiments/experiment-list";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import { InfoPanel } from "@/components/reusable/info-panel";
import { CalendarCheck, LineChart, ArrowRightLeft } from "lucide-react";
import AddExperimentDialog from "@/features/experiments/add-experiment-dialog";

export const Route = createFileRoute("/experiments")({
  component: ExperimentsPage,
});

// Define the guide content sections
const experimentsGuideContent = [
  {
    title: "Getting Started",
    content: `
## Understanding Experiments

Experiments allow you to track the effects of specific actions or changes in your routine. An experiment has:

- A **clear goal** (what you want to achieve)
- A **starting state** (what the current situation is)
- A **ending state** (what the resulting situation is)
- A **defined start date** (when you begin)
- An optional **end date** (when you plan to finish)
- **Metrics** to measure progress and results

Use experiments to determine if certain changes in your habits, diet, exercise routine, or other areas of life produce meaningful results.
    `,
  },
  {
    title: "Creating Experiments",
    content: `
## Setting Up a New Experiment

To create a successful experiment:

1. **Define a specific goal** - Be clear about what you're trying to achieve
2. **Define a starting state** - Document your current situation 
3. **Select appropriate metrics** - Choose metrics that will effectively measure your progress
4. **Set a reasonable timeframe** - Allow enough time to see meaningful results
5. **Be consistent** - Track your metrics regularly throughout the experiment

The more precisely you define your experiment, the more valuable your results will be.
    `,
  },
  {
    title: "Tracking Progress",
    content: `
## Monitoring Your Experiments

As you run your experiment:

1. Log your metrics daily or at your defined schedule
2. Review your progress regularly to stay motivated
3. Make notes about any observations or challenges
4. Adjust your approach if necessary (but document any changes)

The Experiment Details page provides visual charts to help you understand trends and patterns in your data.
    `,
  },
  {
    title: "Analyzing Results",
    content: `
## Understanding Your Outcomes

When your experiment is complete:

1. Compare your starting and ending measurements
2. Look for patterns and correlations in your data
3. Consider external factors that might have influenced results
4. Determine if your hypothesis was correct
5. Decide if the changes you made should become permanent

Remember that not all experiments will yield the results you expect - negative results are still valuable information!
    `,
  },
];

export default function ExperimentsPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Experiments"
          description="Track the effects of specific changes in your routine"
          guideContent={experimentsGuideContent}
          storageKey="experiments-page"
        >
          <AddExperimentDialog buttonLabel="Create New Experiment" />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="About Experiments">
          <InfoPanel
            title="Getting Started"
            variant="tip"
            defaultExpanded={true}
            storageKey="experiments-getting-started"
          >
            <p>
              Experiments are only useful if you add metrics. If you haven't
              made a metric yet, please visit the metric page first!
            </p>

            <p>
              Experiments are a way to track the effects of an action or
              non-action over a period of time. The goal is to understand
              whether the changes you make produce meaningful results.
            </p>
          </InfoPanel>

          <CompactInfoPanel
            title="How to Use Experiments"
            variant="info"
            storageKey="experiments-how-to-use"
          >
            <ol>
              <li>
                1. Create an experiment with a clear goal and a starting state
              </li>
              <li>2. Attach metrics to measure progress</li>
              <li>3. Track your metrics consistently</li>
              <li>4. Review your results in the experiment details</li>
              <li>
                5. Change status to "Completed" when finished and write down the
                end state
              </li>
            </ol>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Experiment Status"
            variant="info"
            storageKey="experiments-status"
          >
            <ul>
              <li>
                <strong>Active</strong>: Currently running experiment
              </li>
              <li>
                <strong>Paused</strong>: Temporarily stopped experiment
              </li>
              <li>
                <strong>Completed</strong>: Finished experiment
              </li>
            </ul>
            <p>
              You can change the status or delete an experiment at any time.
            </p>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Tips for Success"
            variant="tip"
            storageKey="experiments-tips"
          >
            <ul>
              <li>- Be specific with your experiment goal</li>
              <li>- Choose metrics that directly relate to your goal</li>
              <li>- Track consistently for best results</li>
              <li>- Note any deviations or external factors</li>
              <li>- Give experiments enough time to show meaningful results</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Example Experiments"
            variant="info"
            storageKey="experiments-examples"
          >
            <ul>
              <li>- Effect of meditation on stress levels</li>
              <li>- Impact of dietary changes on energy</li>
              <li>- Correlation between sleep quality and productivity</li>
              <li>- Results of a new exercise routine on strength</li>
            </ul>
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-card flex flex-col items-center text-center">
            <ArrowRightLeft className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-medium">Track Changes</h3>
            <p className="text-sm text-muted-foreground">
              Monitor specific actions or habits
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-card flex flex-col items-center text-center">
            <CalendarCheck className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-medium">Measure Results</h3>
            <p className="text-sm text-muted-foreground">
              Track metrics to quantify outcomes
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-card flex flex-col items-center text-center">
            <LineChart className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-medium">Analyze Data</h3>
            <p className="text-sm text-muted-foreground">
              Visualize progress and identify patterns
            </p>
          </div>
        </div>

        <ExperimentList />
      </div>
    </FeatureLayout>
  );
}

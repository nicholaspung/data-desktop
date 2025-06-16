import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CalendarDays, ChevronDown } from "lucide-react";
import { getStatusBadge } from "./experiments-utils";
import { differenceInDays, format, isAfter } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProtectedContent } from "@/components/security/protected-content";
import { Experiment } from "@/store/experiment-definitions";
import { FEATURE_ICONS } from "@/lib/icons";

export default function ExperimentListItem({
  experiment,
  handleSelectExperiment,
  status,
}: {
  experiment: Experiment;
  handleSelectExperiment: (experimentId: string) => void;
  status: string;
}) {
  const getDaysInfo = (experiment: any) => {
    if (!experiment.start_date) return null;

    const startDate = new Date(experiment.start_date);
    const today = new Date();

    if (isAfter(startDate, today)) {
      const daysUntilStart = differenceInDays(startDate, today);
      return {
        text: `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`,
        progress: 0,
      };
    }

    if (experiment.end_date) {
      const endDate = new Date(experiment.end_date);
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const daysElapsed = differenceInDays(today, startDate) + 1;

      if (isAfter(today, endDate)) {
        return {
          text: `Completed`,
          progress: 100,
        };
      }

      const progress = Math.min(
        100,
        Math.round((daysElapsed / totalDays) * 100)
      );
      const daysRemaining = differenceInDays(endDate, today);

      return {
        text: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`,
        progress,
      };
    }

    const daysElapsed = differenceInDays(today, startDate) + 1;
    return {
      text: `Day ${daysElapsed}`,
      progress: 50,
    };
  };

  const daysInfo = getDaysInfo(experiment);

  const Content = () => (
    <Collapsible>
      <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <FEATURE_ICONS.EXPERIMENTS className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">{experiment.name}</h3>
            </div>
            {getStatusBadge(
              experiment.status,
              status.charAt(0).toUpperCase() + status.slice(1)
            )}
          </div>
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span>
                  {format(new Date(experiment.start_date), "MMM d, yyyy")}
                  {experiment.end_date &&
                    ` - ${format(
                      new Date(experiment.end_date),
                      "MMM d, yyyy"
                    )}`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform ui-expanded:rotate-180" />
            </div>
            {daysInfo && (
              <div className="mt-2">
                <div className="flex justify-between text-sm">
                  <span>{daysInfo.text}</span>
                  <span>{daysInfo.progress}%</span>
                </div>
                <Progress value={daysInfo.progress} className="h-1 mt-1" />
              </div>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 pt-4 border-t">
              <div>
                <div className="text-sm font-medium mb-1">Description:</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {experiment.description || "No description provided."}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Goal:</div>
                <div className="text-sm whitespace-pre-wrap">
                  {experiment.goal || "No goal specified."}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSelectExperiment(experiment.id)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );

  return experiment.private ? (
    <ProtectedContent>
      <Content />
    </ProtectedContent>
  ) : (
    <Content />
  );
}

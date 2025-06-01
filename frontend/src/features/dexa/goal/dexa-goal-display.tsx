import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, Trash } from "lucide-react";
import DexaGoalForm from "./dexa-goal-form";
import { GoalStorageService } from "./goal-storage-service";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { DexaGoal } from "../dexa";

export default function DexaGoalDisplay({
  latestScan,
  onGoalChange,
}: {
  latestScan?: {
    total_body_fat_percentage: number;
    total_mass_lbs: number;
    vat_mass_lbs: number;
    date: Date;
  };
  onGoalChange?: () => void;
}) {
  const [goal, setGoal] = useState<DexaGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadGoal = () => {
    setIsLoading(true);
    setError(null);

    try {
      const dexaGoal = GoalStorageService.getGoal();
      setGoal(dexaGoal);
    } catch (error) {
      console.error("Error loading DEXA goal:", error);
      setError("No goal has been set yet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, []);

  const handleGoalSuccess = () => {
    setIsEditing(false);
    loadGoal();
    if (onGoalChange) {
      onGoalChange();
    }
  };

  const handleDeleteGoal = () => {
    try {
      GoalStorageService.deleteGoal();
      setGoal(null);
      if (onGoalChange) {
        onGoalChange();
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <DexaGoalForm
        existingGoal={goal || undefined}
        onSuccess={handleGoalSuccess}
      />
    );
  }

  if (error || !goal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>DEXA Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Trash className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {error || "No goals have been set yet."}
            </p>
            <Button onClick={() => setIsEditing(true)}>Set Your Goals</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateProgress = (
    current: number,
    target: number,
    isLowerBetter = true
  ) => {
    if (isLowerBetter) {
      if (current <= target) return 100;

      const startPoint = current * 1.2;
      const progress = Math.min(
        100,
        Math.max(0, ((startPoint - current) / (startPoint - target)) * 100)
      );
      return progress;
    } else {
      if (current >= target) return 100;

      const startPoint = current * 0.8;
      const progress = Math.min(
        100,
        Math.max(0, ((current - startPoint) / (target - startPoint)) * 100)
      );
      return progress;
    }
  };

  let bodyFatProgress = 0;
  let weightProgress = 0;
  let vatProgress = 0;

  if (latestScan) {
    const isWeightLoss = latestScan.total_mass_lbs > goal.totalWeightLbs;

    bodyFatProgress = calculateProgress(
      latestScan.total_body_fat_percentage,
      goal.bodyFatPercent
    );
    weightProgress = calculateProgress(
      latestScan.total_mass_lbs,
      goal.totalWeightLbs,
      isWeightLoss
    );
    vatProgress = calculateProgress(latestScan.vat_mass_lbs, goal.vatMassLbs);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>DEXA Goals</CardTitle>
          <CardDescription>Your target metrics to achieve</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDeleteDialog
            title="Delete Goal"
            description="Are you sure you want to delete this goal? This action cannot be undone."
            onConfirm={handleDeleteGoal}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Body Fat %</p>
              <p className="text-sm font-medium">
                {latestScan
                  ? `${(latestScan.total_body_fat_percentage < 1
                      ? latestScan.total_body_fat_percentage * 100
                      : latestScan.total_body_fat_percentage
                    ).toFixed(1)}% → `
                  : ""}
                {goal.bodyFatPercent.toFixed(1)}%
              </p>
            </div>
            {latestScan && (
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${bodyFatProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-sm font-medium">
                {latestScan
                  ? `${latestScan.total_mass_lbs.toFixed(1)} lbs → `
                  : ""}
                {goal.totalWeightLbs.toFixed(1)} lbs
              </p>
            </div>
            {latestScan && (
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${weightProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">VAT Mass</p>
              <p className="text-sm font-medium">
                {latestScan
                  ? `${latestScan.vat_mass_lbs.toFixed(2)} lbs → `
                  : ""}
                {goal.vatMassLbs.toFixed(2)} lbs
              </p>
            </div>
            {latestScan && (
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${vatProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

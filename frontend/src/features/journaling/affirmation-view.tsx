// src/features/journaling/affirmation-view.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenSquare, CheckCircle } from "lucide-react";
import { useState } from "react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { Affirmation } from "@/store/journaling-definitions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import AffirmationForm from "./affirmation-form";
import { InfoPanel } from "@/components/reusable/info-panel";

export default function AffirmationView() {
  const [isEditing, setIsEditing] = useState(false);

  const entries = useStore(
    dataStore,
    (state) => state.affirmation as Affirmation[]
  );

  // Get the latest affirmation
  const latestAffirmation =
    entries.length > 0
      ? [...entries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : null;

  // Handle logging the affirmation practice
  const handleLogPractice = async () => {
    if (!latestAffirmation) return;

    try {
      // Here you would add the code to log the practice
      // For example, adding a record to a daily_logs dataset
      toast.success("Practice logged successfully!");
    } catch (error) {
      console.error("Error logging practice:", error);
      toast.error("Failed to log practice. Please try again.");
    }
  };

  // Display explanation info card
  const InfoCard = () => (
    <InfoPanel title="About Gratitude Journaling" defaultExpanded={true}>
      Create an affirmation to reflect on daily, then track each time you
      practice it.
    </InfoPanel>
  );

  // Display current affirmation
  const CurrentAffirmation = () => (
    <Card>
      <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
        <CardTitle className="text-md">Current Affirmation</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsEditing(true)}
        >
          <PenSquare className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{latestAffirmation?.affirmation || ""}</ReactMarkdown>
        </div>

        <div className="mt-6 border-t pt-4">
          <Button
            className="w-full"
            variant="default"
            onClick={handleLogPractice}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Log Today's Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Daily Affirmation</h2>

      <InfoCard />

      {/* Conditionally show form or display current affirmation */}
      {!latestAffirmation || isEditing ? (
        <AffirmationForm
          latestAffirmation={latestAffirmation}
          setIsEditing={setIsEditing}
        />
      ) : (
        <CurrentAffirmation />
      )}
    </div>
  );
}

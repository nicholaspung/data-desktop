import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { useEffect, useState } from "react";
import { addEntry, updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { Affirmation } from "@/store/journaling-definitions";
import { AlertCircle } from "lucide-react";

export default function AffirmationForm({
  latestAffirmation,
  setIsEditing,
  hasTodaysAffirmation,
}: {
  latestAffirmation: Affirmation | null;
  setIsEditing: (isEditing: boolean) => void;
  hasTodaysAffirmation: boolean;
}) {
  const [newAffirmation, setNewAffirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (latestAffirmation) {
      setNewAffirmation(latestAffirmation.affirmation);
    }
  }, [latestAffirmation]);

  const handleSaveAffirmation = async () => {
    if (!newAffirmation.trim()) {
      toast.error("Please enter an affirmation");
      return;
    }

    if (hasTodaysAffirmation && !latestAffirmation) {
      toast.error("You can only create one affirmation per day");
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const date = new Date();
      const newEntry = {
        date,
        affirmation: newAffirmation,
      };

      if (latestAffirmation && hasTodaysAffirmation) {
        const result = await ApiService.updateRecord(latestAffirmation.id, {
          ...latestAffirmation,
          affirmation: newAffirmation,
        });

        if (result) {
          updateEntry(latestAffirmation.id, result, "affirmation");
          toast.success("Affirmation updated!");
        }
      } else {
        const result = await ApiService.addRecord("affirmation", newEntry);

        if (result) {
          addEntry(result, "affirmation");
          toast.success("Affirmation saved!");
        }
      }

      setNewAffirmation("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving affirmation:", error);
      toast.error("Failed to save affirmation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasTodaysAffirmation && !latestAffirmation) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <AlertCircle className="h-10 w-10 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Limit Reached</h3>
          <p className="text-muted-foreground mb-4">
            You've already created an affirmation for today. You can create a
            new one tomorrow.
          </p>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">
              {latestAffirmation && hasTodaysAffirmation
                ? "Update Today's Affirmation"
                : "Create Your Affirmation"}
            </h3>
            {hasTodaysAffirmation && latestAffirmation && (
              <p className="text-sm text-muted-foreground">
                You've already created an affirmation today. You're updating the
                existing one.
              </p>
            )}
          </div>

          <MarkdownEditor
            value={newAffirmation}
            onChange={setNewAffirmation}
            placeholder="I am..."
            minHeight="150px"
          />

          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isSubmitting || !newAffirmation.trim()}
              onClick={handleSaveAffirmation}
            >
              {isSubmitting
                ? "Saving..."
                : latestAffirmation && hasTodaysAffirmation
                  ? "Update Affirmation"
                  : "Save Affirmation"}
            </Button>

            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

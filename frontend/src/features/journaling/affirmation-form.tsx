// src/features/journaling/affirmation-view.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { useEffect, useState } from "react";
import { addEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { Affirmation } from "@/store/journaling-definitions";

export default function AffirmationForm({
  latestAffirmation,
  setIsEditing,
}: {
  latestAffirmation: Affirmation | null;
  setIsEditing: (isEditing: boolean) => void;
}) {
  const [newAffirmation, setNewAffirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with the latest affirmation when editing
  useEffect(() => {
    if (latestAffirmation) {
      setNewAffirmation(latestAffirmation.affirmation);
    }
  }, [latestAffirmation]);

  // Handle saving the affirmation
  const handleSaveAffirmation = async () => {
    if (!newAffirmation.trim()) {
      toast.error("Please enter an affirmation");
      return;
    }

    setIsSubmitting(true);

    try {
      const date = new Date();
      const newEntry = {
        date,
        affirmation: newAffirmation,
      };

      const result = await ApiService.addRecord("affirmation", newEntry);

      if (result) {
        addEntry(result, "affirmation");
        toast.success("Affirmation saved!");
        setNewAffirmation("");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving affirmation:", error);
      toast.error("Failed to save affirmation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display form to create/edit affirmation
  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">
              {latestAffirmation
                ? "Update Your Affirmation"
                : "Create Your Affirmation"}
            </h3>
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
              {isSubmitting ? "Saving..." : "Save Affirmation"}
            </Button>

            {latestAffirmation && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

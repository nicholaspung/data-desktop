// src/features/journaling/affirmation-view.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { Affirmation } from "@/store/journaling-definitions";
import { formatDate } from "@/lib/date-utils";

export default function AffirmationView() {
  const entries = useStore(
    dataStore,
    (state) => state.affirmation as Affirmation[]
  );

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Affirmations</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Affirmation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="bg-primary/10 pb-2">
                <CardTitle className="text-md flex justify-between">
                  <span>{formatDate(entry.date)}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(
                      entry.createdAt || entry.date
                    ).toLocaleTimeString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose dark:prose-invert">
                  {entry.affirmation}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">
                No affirmations added yet.
              </p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Affirmation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

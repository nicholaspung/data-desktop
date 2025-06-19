import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Badge } from "@/components/ui/badge";
import { FEATURE_ICONS } from "@/lib/icons";
import { BookOpen } from "lucide-react";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function JournalingDashboardSummary() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedToday, setHasCompletedToday] = useState({
    gratitude: false,
    question: false,
    creativity: false,
  });

  const gratitudeEntries = useStore(
    dataStore,
    (state) => state.gratitude_journal
  );
  const questionEntries = useStore(
    dataStore,
    (state) => state.question_journal
  );
  const creativityEntries = useStore(
    dataStore,
    (state) => state.creativity_journal
  );

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkEntryForToday = (entries: any[]) => {
      return entries.some((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
    };

    setHasCompletedToday({
      gratitude: checkEntryForToday(gratitudeEntries),
      question: checkEntryForToday(questionEntries),
      creativity: checkEntryForToday(creativityEntries),
    });

    setIsLoading(false);
  }, [gratitudeEntries, questionEntries, creativityEntries]);

  const totalCompleted =
    Object.values(hasCompletedToday).filter(Boolean).length;

  const journalItems = [
    {
      content: (
        <div className="text-center">
          <h3 className="font-medium mb-1">Gratitude</h3>
          <Badge
            variant={hasCompletedToday.gratitude ? "success" : "outline"}
            className={hasCompletedToday.gratitude ? "bg-green-500" : ""}
          >
            {hasCompletedToday.gratitude ? "Completed" : "Not done"}
          </Badge>
        </div>
      ),
    },
    {
      content: (
        <div className="text-center">
          <h3 className="font-medium mb-1">Daily Question</h3>
          <Badge
            variant={hasCompletedToday.question ? "success" : "outline"}
            className={hasCompletedToday.question ? "bg-green-500" : ""}
          >
            {hasCompletedToday.question ? "Completed" : "Not done"}
          </Badge>
        </div>
      ),
    },
    {
      content: (
        <div className="text-center">
          <h3 className="font-medium mb-1">Creativity</h3>
          <Badge
            variant={hasCompletedToday.creativity ? "success" : "outline"}
            className={hasCompletedToday.creativity ? "bg-green-500" : ""}
          >
            {hasCompletedToday.creativity ? "Completed" : "Not done"}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <ReusableSummary
      title="Journaling"
      titleIcon={<FEATURE_ICONS.JOURNALING className="h-5 w-5" />}
      linkTo="/journaling"
      loading={isLoading}
      emptyState={
        gratitudeEntries.length === 0 &&
        questionEntries.length === 0 &&
        creativityEntries.length === 0
          ? {
              message:
                "No journaling entries yet. Start your journaling practice today!",
              actionText: "Start Journaling",
              actionTo: "/journaling",
            }
          : undefined
      }
      mainSection={{
        title: "Today's Progress",
        value: `${totalCompleted} / 3`,
        subText:
          totalCompleted === 3
            ? "All journaling activities completed today!"
            : `${3 - totalCompleted} activities remaining`,
        badge: {
          variant:
            totalCompleted === 3
              ? "success"
              : totalCompleted > 0
                ? "default"
                : "outline",
          children:
            totalCompleted === 3
              ? "Complete"
              : totalCompleted > 0
                ? "In Progress"
                : "Not Started",
          className: totalCompleted === 3 ? "bg-green-500" : "",
        },
      }}
      gridSection={{
        columns: 2,
        items: journalItems,
        className: "mt-4",
      }}
      footer={<div />}
    />
  );
}

registerDashboardSummary({
  route: "/journaling",
  component: JournalingDashboardSummary,
  defaultConfig: {
    id: "/journaling",
    size: "medium",
    order: 5,
    visible: true,
  },
  datasets: [
    "gratitude_journal",
    "question_journal",
    "creativity_journal",
    "affirmation",
  ],
  name: "Journaling",
  description: "Journal thoughts, gratitude, and affirmations",
  icon: BookOpen,
});

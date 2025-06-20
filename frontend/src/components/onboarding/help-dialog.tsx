import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Lock, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FEATURE_ICONS } from "@/lib/icons";

interface HelpTopic {
  title: string;
  icon: React.ReactNode;
  description: string;
  keywords: string[];
  link?: string;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    title: "Getting Started",
    icon: <FEATURE_ICONS.HOME className="h-5 w-5" />,
    description:
      "Learn how to navigate Data Desktop and start tracking your data. Understand the basic concepts and workflow.",
    keywords: [
      "start",
      "begin",
      "intro",
      "introduction",
      "new",
      "first",
      "setup",
    ],
    link: "/",
  },
  {
    title: "Daily Tracking",
    icon: <FEATURE_ICONS.DAILY_TRACKER className="h-5 w-5" />,
    description:
      "Track daily metrics, habits, and goals using the calendar interface. Set up categories and custom schedules for your metrics.",
    keywords: [
      "daily",
      "calendar",
      "track",
      "metric",
      "habit",
      "log",
      "schedule",
      "category",
    ],
    link: "/calendar",
  },
  {
    title: "DEXA Scans",
    icon: <FEATURE_ICONS.DEXA_SCAN className="h-5 w-5" />,
    description:
      "Import DEXA scan results and analyze body composition changes over time. View trends in fat mass, lean tissue, and bone density.",
    keywords: [
      "dexa",
      "body",
      "composition",
      "fat",
      "lean",
      "muscle",
      "bone",
      "density",
      "scan",
    ],
    link: "/dexa",
  },
  {
    title: "Bloodwork",
    icon: <FEATURE_ICONS.BLOODWORK className="h-5 w-5" />,
    description:
      "Track blood test results and biomarkers. Set reference ranges and visualize changes in your health markers over time.",
    keywords: [
      "blood",
      "test",
      "marker",
      "biomarker",
      "lab",
      "reference",
      "range",
    ],
    link: "/bloodwork",
  },
  {
    title: "Body Measurements",
    icon: <FEATURE_ICONS.BODY_MEASUREMENTS className="h-5 w-5" />,
    description:
      "Track your body measurements with an interactive body diagram. Record weight, circumferences, and body composition with privacy controls and comprehensive analysis tools.",
    keywords: [
      "body",
      "measurements",
      "weight",
      "circumference",
      "waist",
      "chest",
      "body fat",
      "private",
      "comparison",
      "trends",
      "visualization",
    ],
    link: "/body-measurements",
  },
  {
    title: "People CRM",
    icon: <FEATURE_ICONS.PEOPLE_CRM className="h-5 w-5" />,
    description:
      "Manage your personal relationships and contacts. Track meetings, notes, attributes, and important dates. Keep private information secure with PIN protection.",
    keywords: [
      "people",
      "crm",
      "contacts",
      "relationships",
      "meetings",
      "notes",
      "attributes",
      "birthdays",
      "private",
      "network",
    ],
    link: "/people-crm",
  },
  {
    title: "Journaling",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    description:
      "Record your thoughts, gratitude, creative ideas, and daily affirmations. Enhance your wellbeing through self-reflection.",
    keywords: [
      "journal",
      "gratitude",
      "reflection",
      "writing",
      "diary",
      "thoughts",
      "affirmation",
      "creativity",
      "questions",
    ],
    link: "/journaling",
  },
  {
    title: "Gratitude Journal",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    description:
      "Express and track things you're grateful for each day to cultivate a positive mindset and increase your overall wellbeing.",
    keywords: [
      "gratitude",
      "thankful",
      "appreciation",
      "journal",
      "positive",
      "mindfulness",
    ],
    link: "/journaling",
  },
  {
    title: "Question Journal",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    description:
      "Answer daily thought-provoking questions to gain insights, foster self-reflection, and track your growth over time.",
    keywords: [
      "questions",
      "reflection",
      "insight",
      "journal",
      "thought",
      "prompts",
      "self-discovery",
    ],
    link: "/journaling",
  },
  {
    title: "Creativity Journal",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    description:
      "Capture your creative ideas, inspirations, and random thoughts to nurture your creativity and build an idea repository.",
    keywords: [
      "creativity",
      "ideas",
      "inspiration",
      "brainstorm",
      "journal",
      "innovation",
      "thoughts",
    ],
    link: "/journaling",
  },
  {
    title: "Daily Affirmations",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    description:
      "Create and practice daily affirmations to reinforce positive beliefs, boost confidence, and support your personal goals.",
    keywords: [
      "affirmation",
      "positive",
      "mantra",
      "belief",
      "mindset",
      "motivation",
      "self-talk",
    ],
    link: "/journaling",
  },
  {
    title: "Experiments",
    icon: <FEATURE_ICONS.EXPERIMENTS className="h-5 w-5" />,
    description:
      "Create experiments to test the impact of lifestyle changes. Define goals, track metrics, and analyze results.",
    keywords: [
      "experiment",
      "test",
      "hypothesis",
      "goal",
      "impact",
      "lifestyle",
      "change",
    ],
    link: "/experiments",
  },
  {
    title: "Metric Logger",
    icon: <FEATURE_ICONS.METRIC_LOGGER className="h-5 w-5" />,
    description:
      "Log metrics outside of your regular schedule. Useful for infrequent events or metrics you don't track daily.",
    keywords: ["logger", "metric", "log", "event", "infrequent", "record"],
    link: "/metric",
  },
  {
    title: "Time Tracker",
    icon: <FEATURE_ICONS.TIME_TRACKER className="h-5 w-5" />,
    description:
      "Track how you spend your time with the timer or manual entries. Organize with categories and tags, then analyze with detailed reports.",
    keywords: [
      "time",
      "track",
      "timer",
      "log",
      "category",
      "tag",
      "productivity",
      "hours",
      "minutes",
      "duration",
      "activity",
    ],
    link: "/time-tracker",
  },
  {
    title: "Data Management",
    icon: <FEATURE_ICONS.DATASETS className="h-5 w-5" />,
    description:
      "Import, export, and manage your data. View all datasets and records in table format.",
    keywords: ["data", "dataset", "table", "import", "export", "csv", "manage"],
    link: "/dataset",
  },
  {
    title: "Security & Privacy",
    icon: <Lock className="h-5 w-5" />,
    description:
      "Protect your data with PIN security. All data is stored locally on your device.",
    keywords: [
      "security",
      "privacy",
      "pin",
      "protect",
      "private",
      "password",
      "lock",
    ],
  },
  {
    title: "Import Data",
    icon: <FileText className="h-5 w-5" />,
    description:
      "Import data from CSV files. Each dataset has a specific format - download templates to get started.",
    keywords: ["import", "csv", "upload", "file", "template", "format"],
  },
];

export default function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTopics = HELP_TOPICS.filter((topic) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      topic.title.toLowerCase().includes(searchLower) ||
      topic.description.toLowerCase().includes(searchLower) ||
      topic.keywords.some((keyword) => keyword.includes(searchLower))
    );
  });

  return (
    <ReusableDialog
      title="Help Center"
      description="Find information about using Data Desktop"
      open={open}
      onOpenChange={onOpenChange}
      showTrigger={false}
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      customContent={
        <div className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {filteredTopics.map((topic, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-primary">{topic.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {topic.description}
                      </p>
                      {topic.link && (
                        <Link to={topic.link}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                          >
                            Go to {topic.title}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredTopics.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No help topics found for "{searchTerm}"</p>
                  <p className="text-sm mt-2">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>
              Need more help? Each page has a dedicated guide button in the
              top-right corner with detailed instructions specific to that
              feature.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                localStorage.removeItem("hasSeenOnboarding");
                window.location.reload();
              }}
            >
              Restart Tutorial
            </Button>
          </div>
        </div>
      }
      customFooter={<></>}
    />
  );
}

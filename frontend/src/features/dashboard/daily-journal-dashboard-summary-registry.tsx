import DailyJournalDashboardSummary from "./daily-journal-dashboard-summary";
import { registerDashboardSummary } from "@/lib/dashboard-registry";
import { BookOpen } from "lucide-react";

registerDashboardSummary({
  route: "/daily-journal",
  component: DailyJournalDashboardSummary,
  defaultConfig: {
    id: "/daily-journal",
    size: "medium",
    height: "medium", 
    order: 8,
    visible: true,
  },
  datasets: ["daily_journal"],
  name: "Daily Journal",
  description: "Daily journal with automatic metric detection",
  icon: BookOpen,
});
import DailyJournalDashboardSummary from "./daily-journal-dashboard-summary";
import { registerDashboardSummary } from "@/lib/dashboard-registry";
import { FEATURE_ICONS } from "@/lib/icons";

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
  icon: FEATURE_ICONS.BOOK_OPEN,
});
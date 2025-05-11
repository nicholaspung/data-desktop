import {
  Home,
  Clock,
  CalendarDays,
  CheckCircle,
  Zap,
  Calendar,
  FlaskConical,
  BookOpen,
  Timer,
  PieChart,
  Activity,
  Database,
  Settings,
  Heart,
  CircleDot,
  // People CRM icons
  Users,
  MessageCircle,
  NotebookPen,
  Gift,
  Network,
  UserRound,
  // Add more icons as needed
} from "lucide-react";

export const FEATURE_ICONS = {
  HOME: Home,
  TIME_TRACKER: Clock,
  DAILY_TRACkER: CalendarDays,
  TODOS: CheckCircle,
  QUICK_METRIC_LOGGER: Zap,
  METRIC_CALENDAR: Calendar,
  EXPERIMENTS: FlaskConical,
  JOURNALING: BookOpen,
  TIME_PLANNER: Timer,
  DEXA_SCAN: PieChart,
  BLOODWORK: Activity,
  DATASETS: Database,
  SETTINGS: Settings,
  DEBUGGER: CircleDot,

  // People CRM icons
  PEOPLE_CRM: Users,
  PEOPLE: UserRound,
  MEETINGS: MessageCircle,
  PERSON_NOTES: NotebookPen,
  BIRTHDAY_REMINDERS: Gift,
  RELATIONSHIPS: Network,
  CHATS: MessageCircle,
  ATTRIBUTES: Heart,
};

// Helper function to get icon by name
export const getFeatureIcon = (iconName: string) => {
  return FEATURE_ICONS[iconName as keyof typeof FEATURE_ICONS] || Home;
};

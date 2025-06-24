import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  Heart, 
  Moon, 
  Dumbbell, 
  Zap, 
  TrendingUp 
} from "lucide-react";
import { ParsedMetric } from "./metric-parser";

interface MetricPreviewProps {
  metric: ParsedMetric;
}

const METRIC_ICONS = {
  weight: Scale,
  mood: Heart,
  sleep: Moon,
  exercise: Dumbbell,
  energy: Zap,
  custom: TrendingUp,
};

const METRIC_COLORS = {
  weight: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  mood: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  sleep: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  exercise: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function MetricPreview({ metric }: MetricPreviewProps) {
  const Icon = METRIC_ICONS[metric.type];
  const colorClass = METRIC_COLORS[metric.type];

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const getValueDisplay = () => {
    if (metric.unit) {
      return `${metric.value} ${metric.unit}`;
    }
    return String(metric.value);
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 border">
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${colorClass}`}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{metric.name}</span>
          <span className="text-xs text-muted-foreground">
            "{metric.originalText}"
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{getValueDisplay()}</span>
        <Badge 
          variant="outline" 
          className={`text-xs ${
            metric.confidence >= 0.8 
              ? "border-green-300 text-green-700" 
              : metric.confidence >= 0.6 
              ? "border-yellow-300 text-yellow-700"
              : "border-red-300 text-red-700"
          }`}
        >
          {getConfidenceLabel(metric.confidence)}
        </Badge>
      </div>
    </div>
  );
}
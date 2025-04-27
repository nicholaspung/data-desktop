// src/components/onboarding/onboarding-modal.tsx
import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Beaker,
  ChartLine,
  Database,
  ClipboardCheck,
  PieChart,
  HeartPulse,
  Lock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Clock,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Data Desktop",
    description:
      "Your personal data tracking platform. Let's explore the key features.",
    icon: <Database className="h-12 w-12 text-primary" />,
    features: [
      "Track DEXA scans for body composition",
      "Monitor bloodwork results",
      "Log daily metrics and habits",
      "Conduct self-experiments",
      "Journal your thoughts and gratitude",
      "Manage your data securely (data is obscured when viewing, but not in the database)",
    ],
  },
  {
    title: "Daily Tracking",
    description: "Build habits and track metrics with our daily tracker.",
    icon: <CalendarCheck className="h-12 w-12 text-primary" />,
    features: [
      "Create custom categories for organization",
      "Add metrics with flexible scheduling",
      "Track completion streaks automatically",
      "View insights with integrated charts",
      "Log data with experiment integration",
    ],
  },
  {
    title: "DEXA Scan Tracking",
    description: "Monitor changes in your body composition over time.",
    icon: <PieChart className="h-12 w-12 text-primary" />,
    features: [
      "Import or manually enter DEXA results",
      "Track body fat, lean mass, and bone density",
      "Visualize regional composition changes",
      "Compare scans to track progress",
      "Identify trends with advanced charts",
    ],
  },
  {
    title: "Bloodwork Analysis",
    description: "Keep track of your blood biomarkers and reference ranges.",
    icon: <HeartPulse className="h-12 w-12 text-primary" />,
    features: [
      "Define custom blood markers",
      "Set reference and optimal ranges",
      "Track trends over multiple tests",
      "Get visual feedback on out-of-range values",
      "Filter by test date, lab, or marker type",
    ],
  },
  {
    title: "Journaling",
    description:
      "Record thoughts, track gratitude, and foster self-reflection.",
    icon: <BookOpen className="h-12 w-12 text-primary" />,
    features: [
      "Keep a daily gratitude journal",
      "Answer thought-provoking questions",
      "Capture creative ideas and inspiration",
      "Create and practice daily affirmations",
      "Track journaling progress and habits",
    ],
  },
  {
    title: "Experiments",
    description: "Track the impact of lifestyle changes scientifically.",
    icon: <Beaker className="h-12 w-12 text-primary" />,
    features: [
      "Create experiments with clear goals",
      "Attach relevant metrics to track",
      "Set target values for measurement",
      "Monitor progress automatically",
      "Analyze results with visual charts",
    ],
  },
  {
    title: "Quick Metric Logger",
    description: "Log metrics on-demand, outside your regular schedule.",
    icon: <ClipboardCheck className="h-12 w-12 text-primary" />,
    features: [
      "Log any metric at any time",
      "Perfect for infrequent events",
      "Manage metrics outside daily view",
      "Search and filter capabilities",
      "Switch between card and list views",
    ],
  },
  {
    title: "Time Tracker",
    description: "Monitor, analyze, and optimize how you spend your time.",
    icon: <Clock className="h-12 w-12 text-primary" />,
    features: [
      "Track time in real-time with the built-in timer",
      "Add manual entries for past activities",
      "Organize with categories and tags for better analysis",
      "See summaries and visualizations of your time usage",
      "Identify patterns and optimize your productivity",
      "Track time metrics that connect with your daily goals",
    ],
  },
  {
    title: "Security & Privacy",
    description: "Protect your sensitive data with built-in security features.",
    icon: <Lock className="h-12 w-12 text-primary" />,
    features: [
      "PIN protection for private data",
      "Automatic lock after timeout",
      "All data stored locally",
      "No data sent to servers",
      "Secure recovery options",
    ],
  },
];

export default function OnboardingModal() {
  const [currentStep, setCurrentStep] = useState(0);
  const { showOnboarding, setShowOnboarding, completeOnboarding } =
    useOnboarding();

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];

  return (
    <ReusableDialog
      title=""
      customContent={
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {currentStepData.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
            <p className="text-muted-foreground mb-4">
              {currentStepData.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-center">Key Features:</h3>
            <ul className="space-y-2">
              {currentStepData.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <ChartLine className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center gap-1">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      }
      open={showOnboarding}
      onOpenChange={setShowOnboarding}
      showTrigger={false}
      customFooter={
        <div className="flex justify-between w-full">
          <div>
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={completeOnboarding}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      }
      contentClassName="sm:max-w-[600px]"
    />
  );
}

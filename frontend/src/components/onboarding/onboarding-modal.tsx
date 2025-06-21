import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChartLine, Lock } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FEATURE_ICONS } from "@/lib/icons";

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
    icon: <FEATURE_ICONS.DATASETS className="h-12 w-12 text-primary" />,
    features: [
      "Track DEXA scans for body composition",
      "Monitor bloodwork and lab results",
      "Record body measurements with privacy controls",
      "Comprehensive wealth and financial tracking",
      "Manage personal relationships and contacts",
      "Log daily metrics and habits with streak tracking",
      "Conduct self-experiments with progress tracking",
      "Journal thoughts, gratitude, and creative ideas",
      "Track time with real-time timers and analytics",
      "Secure private data with PIN protection",
    ],
  },
  {
    title: "Daily Tracking",
    description: "Build habits and track metrics with our daily tracker.",
    icon: <FEATURE_ICONS.DAILY_TRACKER className="h-12 w-12 text-primary" />,
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
    icon: <FEATURE_ICONS.DEXA_SCAN className="h-12 w-12 text-primary" />,
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
    icon: <FEATURE_ICONS.BLOODWORK className="h-12 w-12 text-primary" />,
    features: [
      "Define custom blood markers",
      "Set reference and optimal ranges",
      "Track trends over multiple tests",
      "Get visual feedback on out-of-range values",
      "Filter by test date, lab, or marker type",
    ],
  },
  {
    title: "Body Measurements",
    description:
      "Track your physical progress with comprehensive body measurement tools.",
    icon: (
      <FEATURE_ICONS.BODY_MEASUREMENTS className="h-12 w-12 text-primary" />
    ),
    features: [
      "Interactive body diagram with clickable regions",
      "Record weight, circumferences, and body composition",
      "Privacy controls for sensitive measurements",
      "Date comparison with visual trend indicators",
      "Customizable sum calculations and filtering",
      "Multi-measurement chart overlays with scrollable filters",
    ],
  },
  {
    title: "Wealth Management",
    description:
      "Comprehensive financial tracking for income, expenses, and net worth monitoring.",
    icon: <FEATURE_ICONS.WEALTH className="h-12 w-12 text-primary" />,
    features: [
      "Track all financial transactions with detailed categorization",
      "Monitor account balances across multiple institutions",
      "Record detailed paycheck information with deductions",
      "Store financial documents securely with file management",
      "Real-time net worth calculation with filtering options",
      "Dashboard integration with yearly financial summaries",
      "Bulk import capabilities for efficient data entry",
    ],
  },
  {
    title: "People CRM",
    description:
      "Manage your personal relationships and networking with privacy-focused tools.",
    icon: <FEATURE_ICONS.PEOPLE_CRM className="h-12 w-12 text-primary" />,
    features: [
      "Store contact information and personal details",
      "Track meetings, notes, and important conversations",
      "Manage attributes and relationship categories",
      "Birthday reminders and special dates",
      "Private data protection with PIN security",
      "Network visualization and relationship mapping",
    ],
  },
  {
    title: "Journaling",
    description:
      "Record thoughts, track gratitude, and foster self-reflection.",
    icon: <FEATURE_ICONS.JOURNALING className="h-12 w-12 text-primary" />,
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
    icon: <FEATURE_ICONS.EXPERIMENTS className="h-12 w-12 text-primary" />,
    features: [
      "Create experiments with clear goals",
      "Attach relevant metrics to track",
      "Set target values for measurement",
      "Monitor progress automatically",
      "Analyze results with visual charts",
    ],
  },
  {
    title: "Metric Logger",
    description: "Log metrics on-demand, outside your regular schedule.",
    icon: <FEATURE_ICONS.METRIC_LOGGER className="h-12 w-12 text-primary" />,
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
    icon: <FEATURE_ICONS.TIME_TRACKER className="h-12 w-12 text-primary" />,
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
      "PIN protection for sensitive data across all features",
      "Privacy toggles for individual measurements and contacts",
      "Automatic lock after inactivity timeout",
      "All data stored locally on your device",
      "No data sent to external servers",
      "Secure password and PIN recovery options",
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {currentStepData.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {currentStepData.description}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-center">
                  Key Features:
                </h3>
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
          </ScrollArea>
        </div>
      }
      open={showOnboarding}
      onOpenChange={setShowOnboarding}
      showTrigger={false}
      customFooter={
        <div className="flex justify-between w-full mt-4">
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
      contentClassName="sm:max-w-[600px] h-[80vh] max-h-[600px] flex flex-col"
    />
  );
}

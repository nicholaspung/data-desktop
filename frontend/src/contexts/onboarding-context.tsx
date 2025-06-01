import { createContext } from "react";

export type OnboardingContextType = {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

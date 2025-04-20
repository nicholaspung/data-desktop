// src/hooks/useOnboardingContext.tsx
import { useContext } from "react";
import { OnboardingContext } from "@/contexts/onboarding-context";

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider"
    );
  }
  return context;
}

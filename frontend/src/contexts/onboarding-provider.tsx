import { ReactNode } from "react";
import { OnboardingContext } from "./onboarding-context";
import { useOnboarding } from "@/hooks/useOnboarding";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

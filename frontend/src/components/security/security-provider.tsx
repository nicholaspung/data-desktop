// src/components/security/security-provider.tsx
import { ReactNode } from "react";
import { PinProvider } from "@/contexts/pin-context";
import { SecurityDialogs } from "./security-dialogs";

export function SecurityProvider({ children }: { children: ReactNode }) {
  return (
    <PinProvider>
      {children}
      <SecurityDialogs />
    </PinProvider>
  );
}

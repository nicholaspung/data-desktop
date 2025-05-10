import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { Toaster } from "./components/ui/sonner";
import { SecurityProvider } from "./components/security/security-provider";
import { OnboardingProvider } from "./contexts/onboarding-provider";
import OnboardingModal from "./components/onboarding/onboarding-modal";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement?.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      <SecurityProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <OnboardingProvider>
            <div className="min-h-screen bg-background text-foreground">
              <RouterProvider router={router} />
              <OnboardingModal />
            </div>
          </OnboardingProvider>
          <Toaster richColors />
        </ThemeProvider>
      </SecurityProvider>
    </StrictMode>
  );
}

// src/components/layout/header.tsx - Updated with time tracker in the middle
import { Link } from "@tanstack/react-router";
import ThemeToggle from "../reusable/theme-toggle";
import { Badge } from "../ui/badge";
import { VERSION_NUMBER } from "@/lib/version";
import Logo from "@/assets/logo.svg";
import { PinLockButton } from "../security/pin-lock-button";
import HelpButton from "../onboarding/help-button";
import { Button } from "../ui/button";
import { Power } from "lucide-react";
import TimeTrackerHeaderButton from "@/features/time-tracker/time-tracker-header-button";

export default function Header() {
  const handleDataChange = () => {
    // This will trigger when timer data is saved
  };

  return (
    <header className="sticky top-0 z-10 bg-background border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="Data Desktop Logo" className="h-11 w-11" />
          <h1 className="text-xl font-bold">Data Desktop</h1>
          <Badge variant="secondary" className="text-xs">
            v{VERSION_NUMBER}
          </Badge>
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
          title="Reload"
        >
          <Power className="h-5 w-5" />
        </Button>
      </div>

      {/* Time tracker in the middle */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <TimeTrackerHeaderButton onDataChange={handleDataChange} />
      </div>

      <div className="flex items-center space-x-4">
        <HelpButton />
        <PinLockButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

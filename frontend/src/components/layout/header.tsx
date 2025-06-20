import { Link } from "@tanstack/react-router";
import ThemeToggle from "../reusable/theme-toggle";
import { Badge } from "../ui/badge";
import { VERSION_NUMBER } from "@/lib/version";
import Logo from "@/assets/logo.svg";
import { PinLockButton } from "../security/pin-lock-button";
import HelpButton from "../onboarding/help-button";
import { Button } from "../ui/button";
import { FEATURE_ICONS } from "@/lib/icons";
import TimeTrackerHeaderButton from "@/features/time-tracker/time-tracker-header-button";
import { useStore } from "@tanstack/react-store";
import settingsStore from "@/store/settings-store";

export default function Header() {
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);

  const handleDataChange = () => {};

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
          <FEATURE_ICONS.POWER className="h-5 w-5" />
        </Button>
      </div>
      {visibleRoutes["/time-tracker"] && (
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TimeTrackerHeaderButton onDataChange={handleDataChange} />
        </div>
      )}
      <div className="flex items-center space-x-4">
        <HelpButton />
        <PinLockButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

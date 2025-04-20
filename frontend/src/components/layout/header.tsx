// src/components/layout/header.tsx (updated)
import { Link } from "@tanstack/react-router";
import ThemeToggle from "../reusable/theme-toggle";
import { Badge } from "../ui/badge";
import { VERSION_NUMBER } from "@/lib/version";
import Logo from "@/assets/logo.svg";
import { PinLockButton } from "../security/pin-lock-button";
import HelpButton from "../onboarding/help-button";
import { Button } from "../ui/button";
import { Power } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-background border-b p-4 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <img src={Logo} alt="Data Desktop Logo" className="h-11 w-11" />
        <h1 className="text-xl font-bold">Data Desktop</h1>
        <Badge variant="secondary" className="text-xs">
          v{VERSION_NUMBER}
        </Badge>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
          title="Reload"
        >
          <Power className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex items-center space-x-4">
        <HelpButton />
        <PinLockButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

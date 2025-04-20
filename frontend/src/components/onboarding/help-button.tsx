// src/components/help/help-button.tsx
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import HelpDialog from "./help-dialog";

export default function HelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowHelp(true)}
        title="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}

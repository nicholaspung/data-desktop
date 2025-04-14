// src/components/security/security-dialogs.tsx
import { usePin } from "@/hooks/usePin";
import { PinEntryDialog } from "./pin-entry-dialog";
import { PinSetupDialog } from "./pin-setup-dialog";
import { PinResetDialog } from "./pin-reset-dialog";

export function SecurityDialogs() {
  const {
    showPinEntry,
    setShowPinEntry,
    showPinSetup,
    setShowPinSetup,
    showPinReset,
    setShowPinReset,
  } = usePin();

  return (
    <>
      <PinEntryDialog open={showPinEntry} onOpenChange={setShowPinEntry} />
      <PinSetupDialog open={showPinSetup} onOpenChange={setShowPinSetup} />
      <PinResetDialog open={showPinReset} onOpenChange={setShowPinReset} />
    </>
  );
}

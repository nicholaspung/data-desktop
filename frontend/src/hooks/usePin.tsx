import { useContext } from "react";
import PinContext from "@/contexts/pin-context";

export const usePin = () => {
  const context = useContext(PinContext);

  if (context === undefined) {
    throw new Error("usePin must be used within a PinProvider");
  }

  const openPinEntryDialog = () => {
    context.setShowPinEntry(true);
  };

  const openPinSetupDialog = () => {
    context.setShowPinSetup(true);
  };

  const openPinResetDialog = () => {
    context.setShowPinReset(true);
  };

  return {
    ...context,
    openPinEntryDialog,
    openPinSetupDialog,
    openPinResetDialog,
  };
};

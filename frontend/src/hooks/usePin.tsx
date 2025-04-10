import PinContext from "@/contexts/pin-context";
import { useContext } from "react";

// Hook for using the PIN context
export const usePin = () => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error("usePin must be used within a PinProvider");
  }
  return context;
};

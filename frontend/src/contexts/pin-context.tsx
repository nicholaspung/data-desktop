import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { compareHash, hashValue } from "@/lib/crypto-utils";

interface PinContextType {
  isConfigured: boolean;
  isUnlocked: boolean;
  unlockTimeRemaining: number;
  setupPin: (pin: string, password: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  resetPin: (password: string, newPin: string) => Promise<boolean>;
  lock: () => void;
  clearSettings: () => void;
  extendTime: () => void;
  showPinEntry: boolean;
  showPinSetup: boolean;
  showPinReset: boolean;
  setShowPinEntry: (show: boolean) => void;
  setShowPinSetup: (show: boolean) => void;
  setShowPinReset: (show: boolean) => void;
}

const PinContext = createContext<PinContextType>({
  isConfigured: false,
  isUnlocked: false,
  unlockTimeRemaining: 0,
  setupPin: async () => false,
  unlock: async () => false,
  resetPin: async () => false,
  lock: () => {},
  clearSettings: () => {},
  extendTime: () => {},
  showPinEntry: false,
  showPinSetup: false,
  showPinReset: false,
  setShowPinEntry: () => {},
  setShowPinSetup: () => {},
  setShowPinReset: () => {},
});

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState<number>(0);
  const [unlockTimeRemaining, setUnlockTimeRemaining] = useState<number>(0);

  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinReset, setShowPinReset] = useState(false);

  const AUTO_LOCK_DURATION = 1 * 60;

  useEffect(() => {
    const storedPinHash = localStorage.getItem("pin_hash");
    const storedPasswordHash = localStorage.getItem("password_hash");

    if (storedPinHash) {
      setPinHash(storedPinHash);
    }

    if (storedPasswordHash) {
      setPasswordHash(storedPasswordHash);
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) {
      setUnlockTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, unlockTime + AUTO_LOCK_DURATION - now);

      setUnlockTimeRemaining(remaining);

      if (remaining === 0) {
        setIsUnlocked(false);
        toast.info("Session locked due to timeout");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isUnlocked, unlockTime]);

  const setupPin = useCallback(
    async (pin: string, password: string): Promise<boolean> => {
      try {
        const newPinHash = await hashValue(pin);
        const newPasswordHash = await hashValue(password);

        localStorage.setItem("pin_hash", newPinHash);
        localStorage.setItem("password_hash", newPasswordHash);

        setPinHash(newPinHash);
        setPasswordHash(newPasswordHash);

        setIsUnlocked(true);
        setUnlockTime(Math.floor(Date.now() / 1000));

        toast.success("Security setup successful");
        return true;
      } catch (error) {
        console.error("Error setting up PIN:", error);
        toast.error("Failed to setup security");
        return false;
      }
    },
    []
  );

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pinHash) return false;

      try {
        const isValid = await compareHash(pin, pinHash);

        if (isValid) {
          setIsUnlocked(true);
          setUnlockTime(Math.floor(Date.now() / 1000));
          return true;
        } else {
          toast.error("Incorrect PIN");
          return false;
        }
      } catch (error) {
        console.error("Error unlocking:", error);
        toast.error("Unlock failed");
        return false;
      }
    },
    [pinHash]
  );

  const resetPin = useCallback(
    async (password: string, newPin: string): Promise<boolean> => {
      if (!passwordHash) return false;

      try {
        const isValid = await compareHash(password, passwordHash);

        if (isValid) {
          const newPinHash = await hashValue(newPin);
          localStorage.setItem("pin_hash", newPinHash);
          setPinHash(newPinHash);

          setIsUnlocked(true);
          setUnlockTime(Math.floor(Date.now() / 1000));

          toast.success("PIN reset successful");
          return true;
        } else {
          toast.error("Incorrect password");
          return false;
        }
      } catch (error) {
        console.error("Error resetting PIN:", error);
        toast.error("Failed to reset PIN");
        return false;
      }
    },
    [passwordHash]
  );

  const lock = useCallback(() => {
    setIsUnlocked(false);
    toast.success("Application locked");
  }, []);

  const clearSettings = useCallback(() => {
    localStorage.removeItem("pin_hash");
    localStorage.removeItem("password_hash");
    setPinHash(null);
    setPasswordHash(null);
    setIsUnlocked(false);
    toast.success("Security settings cleared");
  }, []);

  const extendTime = useCallback(() => {
    if (isUnlocked) {
      setUnlockTime(unlockTime + 60);
      toast.success("Session extended by 1 minute");
    }
  }, [isUnlocked, unlockTime]);

  const isConfigured = pinHash !== null && passwordHash !== null;

  const contextValue: PinContextType = {
    isConfigured,
    isUnlocked,
    unlockTimeRemaining,
    setupPin,
    unlock,
    resetPin,
    lock,
    clearSettings,
    extendTime,
    showPinEntry,
    showPinSetup,
    showPinReset,
    setShowPinEntry,
    setShowPinSetup,
    setShowPinReset,
  };

  return (
    <PinContext.Provider value={contextValue}>{children}</PinContext.Provider>
  );
};

export default PinContext;

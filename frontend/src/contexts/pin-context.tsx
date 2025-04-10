// src/contexts/pin-context.tsx
import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { hashValue } from "@/lib/crypto-utils";

interface PinContextType {
  // State
  isConfigured: boolean;
  isUnlocked: boolean;
  unlockTimeRemaining: number; // Seconds remaining before auto-lock

  // Actions
  setupPin: (pin: string, password: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  resetPin: (password: string, newPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  changePassword: (pin: string, newPassword: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  clearSecuritySettings: () => void;

  // Dialog controls
  openPinSetupDialog: () => void;
  openPinEntryDialog: () => void;
  openPinResetDialog: () => void;
}

// Default context values
const defaultContext: PinContextType = {
  isConfigured: false,
  isUnlocked: false,
  unlockTimeRemaining: 0,

  setupPin: async () => false,
  verifyPin: async () => false,
  resetPin: async () => false,
  changePin: async () => false,
  changePassword: async () => false,
  unlock: async () => false,
  lock: () => {},
  clearSecuritySettings: () => {},

  openPinSetupDialog: () => {},
  openPinEntryDialog: () => {},
  openPinResetDialog: () => {},
};

// Create the context
const PinContext = createContext<PinContextType>(defaultContext);

// Local storage keys
const PIN_HASH_KEY = "data_desktop_pin_hash";
const PASSWORD_HASH_KEY = "data_desktop_password_hash";
const PROTECTION_ENABLED_KEY = "data_desktop_protection_enabled";

// Auto-lock timeout in milliseconds (1 minute)
const DEFAULT_AUTO_LOCK_TIMEOUT = 60 * 1000; // 60 seconds

export function PinProvider({ children }: { children: ReactNode }) {
  // State
  const [isConfigured, setIsConfigured] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockTimeRemaining, setUnlockTimeRemaining] = useState(0);

  // Dialog state
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);
  const [isPinEntryOpen, setIsPinEntryOpen] = useState(false);
  const [isPinResetOpen, setIsPinResetOpen] = useState(false);

  // Timer references
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total lock timeout in seconds
  const totalLockTimeSeconds = DEFAULT_AUTO_LOCK_TIMEOUT / 1000;

  // Check if PIN is configured on mount
  useEffect(() => {
    const pinHash = localStorage.getItem(PIN_HASH_KEY);
    const passwordHash = localStorage.getItem(PASSWORD_HASH_KEY);

    const configured = !!(pinHash && passwordHash);
    setIsConfigured(configured);

    // If PIN is not configured, open setup dialog automatically
    if (!configured) {
      setIsPinSetupOpen(true);
    }
  }, []);

  // Setup auto-lock timer and countdown
  const setupAutoLockTimer = useCallback(() => {
    // Clear any existing timers
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set initial countdown time
    setUnlockTimeRemaining(totalLockTimeSeconds);

    // Set up countdown interval (every second)
    countdownIntervalRef.current = setInterval(() => {
      setUnlockTimeRemaining((prev) => {
        if (prev <= 1) {
          // Clear interval when time is up
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set a new lock timeout
    lockTimeoutRef.current = setTimeout(() => {
      if (isUnlocked) {
        setIsUnlocked(false);
        toast.info("Private data has been locked due to inactivity");

        // Clear the countdown when locked
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        setUnlockTimeRemaining(0);
      }
    }, DEFAULT_AUTO_LOCK_TIMEOUT);

    return () => {
      // Cleanup function
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isUnlocked, totalLockTimeSeconds]);

  // Set up the auto-lock timer when unlocked
  useEffect(() => {
    if (isUnlocked) {
      const cleanup = setupAutoLockTimer();

      // Set up event listeners to reset the timer when user is active
      const resetTimer = () => {
        if (isUnlocked) {
          cleanup();
          setupAutoLockTimer();
        }
      };

      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);

      return () => {
        cleanup();
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("keydown", resetTimer);
      };
    } else {
      // When locked, ensure the countdown is stopped and reset
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setUnlockTimeRemaining(0);
    }
  }, [isUnlocked, setupAutoLockTimer]);

  // PIN Setup function
  const setupPin = async (pin: string, password: string): Promise<boolean> => {
    try {
      if (pin.length < 4) {
        toast.error("PIN must be at least 4 digits");
        return false;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }

      // Hash the PIN and password
      const pinHash = await hashValue(pin);
      const passwordHash = await hashValue(password);

      // Store in localStorage
      localStorage.setItem(PIN_HASH_KEY, pinHash);
      localStorage.setItem(PASSWORD_HASH_KEY, passwordHash);
      localStorage.setItem(PROTECTION_ENABLED_KEY, "true");

      setIsConfigured(true);
      setIsUnlocked(true); // Auto-unlock after setup

      // Start the countdown timer
      setupAutoLockTimer();

      toast.success("Security settings configured successfully");
      return true;
    } catch (error) {
      console.error("Error setting up PIN:", error);
      toast.error("Failed to set up security settings");
      return false;
    }
  };

  // PIN Verification function
  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const storedPinHash = localStorage.getItem(PIN_HASH_KEY);
      if (!storedPinHash) return false;

      const pinHash = await hashValue(pin);
      return pinHash === storedPinHash;
    } catch (error) {
      console.error("Error verifying PIN:", error);
      return false;
    }
  };

  // Password Verification function
  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const storedPasswordHash = localStorage.getItem(PASSWORD_HASH_KEY);
      if (!storedPasswordHash) return false;

      const passwordHash = await hashValue(password);
      return passwordHash === storedPasswordHash;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  };

  // Reset PIN using password
  const resetPin = async (
    password: string,
    newPin: string
  ): Promise<boolean> => {
    try {
      if (newPin.length < 4) {
        toast.error("PIN must be at least 4 digits");
        return false;
      }

      const isPasswordCorrect = await verifyPassword(password);
      if (!isPasswordCorrect) {
        toast.error("Incorrect password");
        return false;
      }

      // Hash the new PIN
      const newPinHash = await hashValue(newPin);
      localStorage.setItem(PIN_HASH_KEY, newPinHash);

      setIsUnlocked(true); // Auto-unlock after reset
      toast.success("PIN reset successfully");
      return true;
    } catch (error) {
      console.error("Error resetting PIN:", error);
      toast.error("Failed to reset PIN");
      return false;
    }
  };

  // Change PIN
  const changePin = async (
    currentPin: string,
    newPin: string
  ): Promise<boolean> => {
    try {
      if (newPin.length < 4) {
        toast.error("PIN must be at least 4 digits");
        return false;
      }

      const isPinCorrect = await verifyPin(currentPin);
      if (!isPinCorrect) {
        toast.error("Incorrect PIN");
        return false;
      }

      // Hash the new PIN
      const newPinHash = await hashValue(newPin);
      localStorage.setItem(PIN_HASH_KEY, newPinHash);

      toast.success("PIN changed successfully");
      return true;
    } catch (error) {
      console.error("Error changing PIN:", error);
      toast.error("Failed to change PIN");
      return false;
    }
  };

  // Change password
  const changePassword = async (
    pin: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }

      const isPinCorrect = await verifyPin(pin);
      if (!isPinCorrect) {
        toast.error("Incorrect PIN");
        return false;
      }

      // Hash the new password
      const newPasswordHash = await hashValue(newPassword);
      localStorage.setItem(PASSWORD_HASH_KEY, newPasswordHash);

      toast.success("Password changed successfully");
      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
      return false;
    }
  };

  // Unlock function
  const unlock = async (pin: string): Promise<boolean> => {
    try {
      const isCorrect = await verifyPin(pin);
      if (!isCorrect) {
        toast.error("Incorrect PIN");
        return false;
      }

      setIsUnlocked(true);

      // Setup countdown timer
      setupAutoLockTimer();

      return true;
    } catch (error) {
      console.error("Error unlocking:", error);
      toast.error("Failed to unlock");
      return false;
    }
  };

  // Lock function
  const lock = useCallback(() => {
    setIsUnlocked(false);

    // Clear lock timers
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }

    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Reset countdown
    setUnlockTimeRemaining(0);
  }, []);

  // Clear security settings
  const clearSecuritySettings = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(PASSWORD_HASH_KEY);
    localStorage.removeItem(PROTECTION_ENABLED_KEY);

    setIsConfigured(false);
    setIsUnlocked(false);

    // Clear timers
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setUnlockTimeRemaining(0);

    toast.info("Security settings cleared");
  }, []);

  // Dialog control functions
  const openPinSetupDialog = useCallback(() => {
    setIsPinSetupOpen(true);
  }, []);

  const openPinEntryDialog = useCallback(() => {
    setIsPinEntryOpen(true);
  }, []);

  const openPinResetDialog = useCallback(() => {
    setIsPinResetOpen(true);
  }, []);

  const contextValue: PinContextType = {
    isConfigured,
    isUnlocked,
    unlockTimeRemaining,

    setupPin,
    verifyPin,
    resetPin,
    changePin,
    changePassword,
    unlock,
    lock,
    clearSecuritySettings,

    openPinSetupDialog,
    openPinEntryDialog,
    openPinResetDialog,
  };

  return (
    <PinContext.Provider value={contextValue}>
      {children}

      {/* Render the dialog components here */}
      {isPinSetupOpen && (
        <PinSetupDialog
          open={isPinSetupOpen}
          onOpenChange={setIsPinSetupOpen}
        />
      )}

      {isPinEntryOpen && (
        <PinEntryDialog
          open={isPinEntryOpen}
          onOpenChange={setIsPinEntryOpen}
        />
      )}

      {isPinResetOpen && (
        <PinResetDialog
          open={isPinResetOpen}
          onOpenChange={setIsPinResetOpen}
        />
      )}
    </PinContext.Provider>
  );
}

// Import dialog components
import { PinSetupDialog } from "@/components/security/pin-setup-dialog";
import { PinEntryDialog } from "@/components/security/pin-entry-dialog";
import { PinResetDialog } from "@/components/security/pin-reset-dialog";

export default PinContext;

// src/features/time-tracker/pomodoro-notification.tsx
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@tanstack/react-store";
import { pomodoroStore } from "./pomodoro-store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Check if browser supports notifications
const notificationsSupported =
  typeof window !== "undefined" && "Notification" in window;

export default function PomodoroNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const isActive = useStore(pomodoroStore, (state) => state.isActive);
  const isBreak = useStore(pomodoroStore, (state) => state.isBreak);
  const remainingSeconds = useStore(
    pomodoroStore,
    (state) => state.remainingSeconds
  );
  const remainingBreakSeconds = useStore(
    pomodoroStore,
    (state) => state.remainingBreakSeconds
  );
  const description = useStore(pomodoroStore, (state) => state.description);

  // Request notification permission on mount
  useEffect(() => {
    if (notificationsSupported && Notification.permission === "default") {
      // We'll ask for permission when user interacts with the page
      const askForPermission = () => {
        Notification.requestPermission();
        document.removeEventListener("click", askForPermission);
      };

      document.addEventListener("click", askForPermission, { once: true });

      return () => {
        document.removeEventListener("click", askForPermission);
      };
    }
  }, []);

  // Function to show OS notification
  const showOSNotification = useCallback((title: string, body: string) => {
    if (!notificationsSupported) return;

    if (Notification.permission === "granted") {
      try {
        // Create and show notification
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico", // Replace with your app's icon
          silent: false,
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Handle click on notification
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.error("Error showing notification:", err);
      }
    }
  }, []);

  useEffect(() => {
    // Show notification when timer reaches zero
    if (isActive && !isBreak && remainingSeconds === 0) {
      setShowNotification(true);

      // Show OS notification
      showOSNotification(
        "Pomodoro Complete!",
        `${description || "Your session"} is complete. Time for a break!`
      );
    }

    if (isActive && isBreak && remainingBreakSeconds === 0) {
      setShowNotification(true);

      // Show OS notification
      showOSNotification(
        "Break Time Complete!",
        "Your break time is over. Ready to start a new Pomodoro?"
      );
    }
  }, [
    isActive,
    isBreak,
    remainingSeconds,
    remainingBreakSeconds,
    description,
    showOSNotification,
  ]);

  return (
    <AlertDialog open={showNotification} onOpenChange={setShowNotification}>
      <AlertDialogContent
        className={cn(
          isBreak ? "border-blue-500" : "border-red-500",
          "max-w-[400px]"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isBreak ? (
              <>
                <Coffee className="h-5 w-5 text-blue-500" />
                Break Time Complete!
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-red-500" />
                Pomodoro Complete!
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBreak
              ? "Your break time is over. Ready to start a new Pomodoro?"
              : `Great job completing "${description || "your session"}"! Time to take a break.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowNotification(false)} variant="outline">
            Dismiss
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

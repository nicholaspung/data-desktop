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

  useEffect(() => {
    if (notificationsSupported && Notification.permission === "default") {
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

  const showOSNotification = useCallback((title: string, body: string) => {
    if (!notificationsSupported) return;

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          silent: false,
        });

        setTimeout(() => notification.close(), 5000);

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
    if (isActive && !isBreak && remainingSeconds === 0) {
      setShowNotification(true);

      showOSNotification(
        "Pomodoro Complete!",
        "Your Pomodoro session is complete. Time for a break!"
      );
    }

    if (isActive && isBreak && remainingBreakSeconds === 0) {
      setShowNotification(true);

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
              : "Great job completing your Pomodoro session! Time to take a break."}
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

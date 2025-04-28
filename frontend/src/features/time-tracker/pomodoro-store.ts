// src/features/time-tracker/pomodoro-store.ts
import { Store } from "@tanstack/react-store";
import { timeTrackerStore, stopTimer } from "./time-tracker-store";

export type PomodoroTimerState = {
  isActive: boolean;
  isBreak: boolean;
  startTime: Date | null;
  totalSeconds: number;
  remainingSeconds: number;
  breakSeconds: number;
  remainingBreakSeconds: number;
  usePomodoroActive: boolean; // Add this setting to the store
};

const getInitialPomodoroMinutes = (): number => {
  try {
    const saved = localStorage.getItem("pomodoro-minutes");
    return saved ? parseInt(saved) : 25;
  } catch (e) {
    console.error("Error retrieving pomodoro minutes from localStorage:", e);
    return 25;
  }
};

const getInitialBreakMinutes = (): number => {
  try {
    const saved = localStorage.getItem("pomodoro-break-minutes");
    return saved ? parseInt(saved) : 5;
  } catch (e) {
    console.error("Error retrieving break minutes from localStorage:", e);
    return 5;
  }
};

// Initial state
const initialState: PomodoroTimerState = {
  isActive: false,
  isBreak: false,
  startTime: null,
  totalSeconds: getInitialPomodoroMinutes() * 60,
  remainingSeconds: getInitialPomodoroMinutes() * 60,
  breakSeconds: getInitialBreakMinutes() * 60,
  remainingBreakSeconds: getInitialBreakMinutes() * 60,
  usePomodoroActive: false,
};

// Create the store
export const pomodoroStore = new Store<PomodoroTimerState>(initialState);

// Setup a global interval for the timer
let timerInterval: number | null = null;

// Start the global timer
const startGlobalTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = window.setInterval(() => {
    updateRemainingTime();
  }, 1000);
};

// Stop the global timer
const stopGlobalTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// Helper functions
export const startPomodoro = (
  customTotalSeconds?: number,
  customBreakSeconds?: number
) => {
  const totalSeconds = customTotalSeconds || pomodoroStore.state.totalSeconds;
  const breakSeconds = customBreakSeconds || pomodoroStore.state.breakSeconds;
  const now = new Date();

  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: true,
    isBreak: false,
    startTime: now,
    totalSeconds,
    remainingSeconds: totalSeconds,
    breakSeconds,
    remainingBreakSeconds: breakSeconds,
  }));

  // Start the global timer
  startGlobalTimer();
};

export const startBreak = () => {
  const now = new Date();

  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: true,
    isBreak: true,
    startTime: now,
    remainingBreakSeconds: prevState.breakSeconds,
  }));

  // Make sure the global timer is running
  startGlobalTimer();
};

export const stopPomodoro = () => {
  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: false,
    isBreak: false,
    startTime: null,
  }));

  // Stop the global timer
  stopGlobalTimer();

  // Also stop the global time tracker if it's running
  if (timeTrackerStore.state.isTimerActive) {
    stopTimer();
  }
};

export const updateRemainingTime = () => {
  const state = pomodoroStore.state;
  if (state.isActive) {
    if (state.isBreak) {
      // Update break time
      pomodoroStore.setState((prevState) => ({
        ...prevState,
        remainingBreakSeconds: Math.max(0, prevState.remainingBreakSeconds - 1),
      }));
    } else {
      // Update pomodoro time
      pomodoroStore.setState((prevState) => ({
        ...prevState,
        remainingSeconds: Math.max(0, prevState.remainingSeconds - 1),
      }));
    }
  }
};

export const setPomodoroSettings = (
  pomodoroMinutes: number,
  breakMinutes: number
) => {
  const totalSeconds = pomodoroMinutes * 60;
  const breakSeconds = breakMinutes * 60;

  pomodoroStore.setState((prevState) => ({
    ...prevState,
    totalSeconds,
    breakSeconds,
    remainingSeconds:
      prevState.isActive && !prevState.isBreak
        ? Math.min(prevState.remainingSeconds, totalSeconds)
        : totalSeconds,
    remainingBreakSeconds:
      prevState.isActive && prevState.isBreak
        ? Math.min(prevState.remainingBreakSeconds, breakSeconds)
        : breakSeconds,
  }));
};

export const setUsePomodoroActive = (active: boolean) => {
  pomodoroStore.setState((prevState) => ({
    ...prevState,
    usePomodoroActive: active,
  }));
};

export const getTimerData = () => {
  return {
    isActive: pomodoroStore.state.isActive,
    isBreak: pomodoroStore.state.isBreak,
    startTime: pomodoroStore.state.startTime,
    totalSeconds: pomodoroStore.state.totalSeconds,
    remainingSeconds: pomodoroStore.state.remainingSeconds,
    breakSeconds: pomodoroStore.state.breakSeconds,
    remainingBreakSeconds: pomodoroStore.state.remainingBreakSeconds,
    usePomodoroActive: pomodoroStore.state.usePomodoroActive,
  };
};

// Setup cleanup when the module is hot-reloaded or the app shuts down
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    stopGlobalTimer();
  });
}

// Initialize timer if necessary (e.g., on page reload with active timer)
if (pomodoroStore.state.isActive) {
  startGlobalTimer();
}

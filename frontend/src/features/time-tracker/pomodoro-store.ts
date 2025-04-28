// src/features/time-tracker/pomodoro-store.ts
import { Store } from "@tanstack/react-store";

export type PomodoroTimerState = {
  isActive: boolean;
  isBreak: boolean;
  startTime: Date | null;
  totalSeconds: number;
  remainingSeconds: number;
  breakSeconds: number;
  remainingBreakSeconds: number;
  description: string;
  categoryId?: string;
  tags: string;
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
  description: "",
  categoryId: undefined,
  tags: "",
};

// Create the store
export const pomodoroStore = new Store<PomodoroTimerState>(initialState);

// Helper functions
export const startPomodoro = (
  description: string,
  categoryId?: string,
  tags: string = "",
  customTotalSeconds?: number,
  customBreakSeconds?: number
) => {
  const totalSeconds = customTotalSeconds || pomodoroStore.state.totalSeconds;
  const breakSeconds = customBreakSeconds || pomodoroStore.state.breakSeconds;

  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: true,
    isBreak: false,
    startTime: new Date(),
    totalSeconds,
    remainingSeconds: totalSeconds,
    breakSeconds,
    remainingBreakSeconds: breakSeconds,
    description,
    categoryId,
    tags: tags ? `${tags}, pomodoro` : "pomodoro",
  }));
};

export const startBreak = () => {
  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: true,
    isBreak: true,
    startTime: new Date(),
    remainingBreakSeconds: prevState.breakSeconds,
    tags: prevState.tags.includes("pomodoro break")
      ? prevState.tags
      : prevState.tags
        ? `${prevState.tags}, pomodoro break`
        : "pomodoro break",
  }));
};

export const stopPomodoro = () => {
  pomodoroStore.setState((prevState) => ({
    ...prevState,
    isActive: false,
    isBreak: false,
    startTime: null,
  }));
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

export const getTimerData = () => {
  return {
    isActive: pomodoroStore.state.isActive,
    isBreak: pomodoroStore.state.isBreak,
    startTime: pomodoroStore.state.startTime,
    totalSeconds: pomodoroStore.state.totalSeconds,
    remainingSeconds: pomodoroStore.state.remainingSeconds,
    breakSeconds: pomodoroStore.state.breakSeconds,
    remainingBreakSeconds: pomodoroStore.state.remainingBreakSeconds,
    description: pomodoroStore.state.description,
    categoryId: pomodoroStore.state.categoryId,
    tags: pomodoroStore.state.tags,
  };
};

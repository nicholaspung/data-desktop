import { Store } from "@tanstack/react-store";

export type TimeTrackerStoreState = {
  isTimerActive: boolean;
  startTime: Date | null;
  description: string;
  categoryId?: string;
  tags: string;
  elapsedSeconds: number;
};

const initialState: TimeTrackerStoreState = {
  isTimerActive: false,
  startTime: null,
  description: "",
  categoryId: undefined,
  tags: "",
  elapsedSeconds: 0,
};

export const timeTrackerStore = new Store<TimeTrackerStoreState>(initialState);

export const startTimer = (
  description: string,
  categoryId?: string,
  tags: string = ""
) => {
  timeTrackerStore.setState((prevState) => ({
    ...prevState,
    isTimerActive: true,
    startTime: new Date(),
    description,
    categoryId,
    tags,
    elapsedSeconds: 0,
  }));
};

export const stopTimer = () => {
  const currentState = timeTrackerStore.state;

  if (!currentState.isTimerActive) return;

  timeTrackerStore.setState((state) => ({
    ...state,
    isTimerActive: false,
    startTime: null,
    elapsedSeconds: 0,
    description: "",
    categoryId: undefined,
    tags: "",
  }));
};

export const updateElapsedTime = () => {
  const state = timeTrackerStore.state;
  if (state.isTimerActive && state.startTime) {
    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - state.startTime.getTime()) / 1000
    );
    timeTrackerStore.setState((prevState) => ({
      ...prevState,
      elapsedSeconds,
    }));
  }
};

export const getTimerData = () => {
  return {
    isActive: timeTrackerStore.state.isTimerActive,
    startTime: timeTrackerStore.state.startTime,
    description: timeTrackerStore.state.description,
    categoryId: timeTrackerStore.state.categoryId,
    tags: timeTrackerStore.state.tags,
    elapsedSeconds: timeTrackerStore.state.elapsedSeconds,
  };
};

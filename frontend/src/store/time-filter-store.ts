import { Store } from "@tanstack/react-store";
import { TimeEntry } from "./time-tracking-definitions";

interface TimeFilterState {
  hiddenHours: number[]; // Array of hours (0-23) to hide
}

const getInitialState = (): TimeFilterState => {
  try {
    const stored = localStorage.getItem("timeFilterSettings");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hiddenHours: Array.isArray(parsed.hiddenHours)
          ? parsed.hiddenHours
          : [],
      };
    }
  } catch (error) {
    console.warn("Failed to load time filter settings:", error);
  }

  return {
    hiddenHours: [],
  };
};

export const timeFilterStore = new Store(getInitialState());

timeFilterStore.subscribe(() => {
  try {
    localStorage.setItem(
      "timeFilterSettings",
      JSON.stringify(timeFilterStore.state)
    );
  } catch (error) {
    console.warn("Failed to save time filter settings:", error);
  }
});

export const toggleHiddenHour = (hour: number) => {
  timeFilterStore.setState((state) => {
    const newHiddenHours = state.hiddenHours.includes(hour)
      ? state.hiddenHours.filter((h) => h !== hour)
      : [...state.hiddenHours, hour].sort((a, b) => a - b);

    return {
      ...state,
      hiddenHours: newHiddenHours,
    };
  });
};

export const setHiddenHours = (hours: number[]) => {
  timeFilterStore.setState((state) => ({
    ...state,
    hiddenHours: [...hours].sort((a, b) => a - b),
  }));
};

export const clearHiddenHours = () => {
  timeFilterStore.setState((state) => ({
    ...state,
    hiddenHours: [],
  }));
};

export const filterTimeEntries = (
  entries: TimeEntry[],
  hiddenHours: number[]
): TimeEntry[] => {
  if (hiddenHours.length === 0) {
    return entries;
  }

  const filteredEntries = entries.filter((entry) => {
    if (!entry.start_time || !entry.end_time) {
      return true;
    }

    const startHour = new Date(entry.start_time).getHours();
    const endHour = new Date(entry.end_time).getHours();

    const entryHours = [];

    if (startHour === endHour) {
      entryHours.push(startHour);
    } else {
      let currentHour = startHour;
      while (currentHour !== endHour) {
        entryHours.push(currentHour);
        currentHour = (currentHour + 1) % 24;
      }
      entryHours.push(endHour);
    }

    const shouldKeep = entryHours.some((hour) => !hiddenHours.includes(hour));

    return shouldKeep;
  });

  return filteredEntries;
};

export const useFilteredTimeEntries = (entries: TimeEntry[]) => {
  const hiddenHours = timeFilterStore.state.hiddenHours;
  return filterTimeEntries(entries, hiddenHours);
};

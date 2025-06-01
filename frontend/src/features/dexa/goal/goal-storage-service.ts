import { DexaGoal } from "../dexa";

export const GoalStorageService = {
  getGoal(): DexaGoal | null {
    try {
      const goalJson = localStorage.getItem("dexaGoal");
      return goalJson ? JSON.parse(goalJson) : null;
    } catch (error) {
      console.error("Error getting goal from localStorage:", error);
      return null;
    }
  },
  setGoal(goal: Omit<DexaGoal, "id" | "createdAt" | "lastModified">): DexaGoal {
    try {
      const now = new Date().toISOString();
      const completeGoal: DexaGoal = {
        ...goal,
        id: crypto.randomUUID(),
        createdAt: now,
        lastModified: now,
      };

      localStorage.setItem("dexaGoal", JSON.stringify(completeGoal));
      return completeGoal;
    } catch (error) {
      console.error("Error saving goal to localStorage:", error);
      throw new Error("Failed to save goal");
    }
  },
  updateGoal(goal: DexaGoal): DexaGoal {
    try {
      const existingGoal = this.getGoal();
      if (!existingGoal) {
        throw new Error("No goal exists to update");
      }

      const updatedGoal: DexaGoal = {
        ...goal,
        lastModified: new Date().toISOString(),
        createdAt: existingGoal.createdAt,
      };

      localStorage.setItem("dexaGoal", JSON.stringify(updatedGoal));
      return updatedGoal;
    } catch (error) {
      console.error("Error updating goal in localStorage:", error);
      throw new Error("Failed to update goal");
    }
  },
  deleteGoal(): void {
    try {
      localStorage.removeItem("dexaGoal");
    } catch (error) {
      console.error("Error deleting goal from localStorage:", error);
      throw new Error("Failed to delete goal");
    }
  },
};

// src/features/dexa/goal/goal-storage-service.ts

import { DexaGoal } from "../dexa";

export const GoalStorageService = {
  /**
   * Get the stored DEXA goal
   * @returns The goal object or null if no goal is set
   */
  getGoal(): DexaGoal | null {
    try {
      const goalJson = localStorage.getItem("dexaGoal");
      return goalJson ? JSON.parse(goalJson) : null;
    } catch (error) {
      console.error("Error getting goal from localStorage:", error);
      return null;
    }
  },

  /**
   * Save a DEXA goal to localStorage
   * @param goal The goal to save (without id, createdAt, lastModified)
   * @returns The complete goal object including generated fields
   */
  setGoal(goal: Omit<DexaGoal, "id" | "createdAt" | "lastModified">): DexaGoal {
    try {
      const now = new Date().toISOString();
      const completeGoal: DexaGoal = {
        ...goal,
        id: crypto.randomUUID(), // Generate a unique ID
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

  /**
   * Update an existing DEXA goal
   * @param goal The goal with updated values
   * @returns The updated goal object
   */
  updateGoal(goal: DexaGoal): DexaGoal {
    try {
      const existingGoal = this.getGoal();
      if (!existingGoal) {
        throw new Error("No goal exists to update");
      }

      const updatedGoal: DexaGoal = {
        ...goal,
        lastModified: new Date().toISOString(),
        createdAt: existingGoal.createdAt, // Preserve the original creation date
      };

      localStorage.setItem("dexaGoal", JSON.stringify(updatedGoal));
      return updatedGoal;
    } catch (error) {
      console.error("Error updating goal in localStorage:", error);
      throw new Error("Failed to update goal");
    }
  },

  /**
   * Delete the stored DEXA goal
   */
  deleteGoal(): void {
    try {
      localStorage.removeItem("dexaGoal");
    } catch (error) {
      console.error("Error deleting goal from localStorage:", error);
      throw new Error("Failed to delete goal");
    }
  },
};

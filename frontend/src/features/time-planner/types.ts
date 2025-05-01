// src/features/time-planner/types.ts
export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category: string;
  color?: string;
}

export type CategoryWithColor = {
  id: string;
  name: string;
  color: string;
};

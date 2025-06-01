export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // Hours in 24-hour format
  startMinute: number; // Minutes
  endHour: number; // Hours in 24-hour format
  endMinute: number; // Minutes
  category: string;
  color?: string;
}

export type CategoryWithColor = {
  id: string;
  name: string;
  color: string;
};

export interface TimeBlockConfig {
  id: string;
  name: string;
  description?: string;
  blocks: TimeBlock[];
  createdAt: Date;
  lastModified: Date;
}

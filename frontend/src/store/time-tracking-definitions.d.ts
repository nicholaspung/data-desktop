// src/store/time-tracking-definitions.d.ts
export interface TimeEntry {
  id: string;
  description: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  category_id?: string;
  category_id_data?: TimeCategory;
  tags?: string;
  private: boolean;

  // Metadata fields
  createdAt?: Date;
  lastModified?: Date;
}

export interface TimeCategory {
  id: string;
  name: string;
  color?: string;
  private: boolean;

  // Metadata fields
  createdAt?: Date;
  lastModified?: Date;
}

// Partial types for form handling and updates
export type PartialTimeEntry = Partial<TimeEntry>;
export type PartialTimeCategory = Partial<TimeCategory>;

// Input types for creating new records (without metadata)
export type TimeEntryInput = Omit<
  TimeEntry,
  "id" | "createdAt" | "lastModified" | "category_id_data"
>;
export type TimeCategoryInput = Omit<
  TimeCategory,
  "id" | "createdAt" | "lastModified"
>;

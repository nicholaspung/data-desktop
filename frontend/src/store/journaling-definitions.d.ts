// frontend/src/store/gratitude-journal-definitions.d.ts
export interface GratitudeJournalEntry {
  date: Date;
  entry: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Partial type for form handling and updates
export type PartialGratitudeJournalEntry = Partial<GratitudeJournalEntry>;

// Input type for creating new records (without metadata)
export type GratitudeJournalEntryInput = Omit<
  GratitudeJournalEntry,
  "id" | "createdAt" | "lastModified"
>;

export interface QuestionJournalEntry {
  date: Date;
  entry: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Partial type for form handling and updates
export type PartialQuestionJournalEntry = Partial<QuestionJournalEntry>;

// Input type for creating new records (without metadata)
export type QuestionJournalEntryInput = Omit<
  QuestionJournalEntry,
  "id" | "createdAt" | "lastModified"
>;

export interface CreativityJournalEntry {
  date: Date;
  entry: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Partial type for form handling and updates
export type PartialCreativityJournalEntry = Partial<CreativityJournalEntry>;

// Input type for creating new records (without metadata)
export type CreativityJournalEntryInput = Omit<
  CreativityJournalEntry,
  "id" | "createdAt" | "lastModified"
>;

export interface Affirmation {
  date: Date;
  affirmation: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Partial type for form handling and updates
export type PartialAffirmation = Partial<Affirmation>;

// Input type for creating new records (without metadata)
export type AffirmationInput = Omit<
  Affirmation,
  "id" | "createdAt" | "lastModified"
>;

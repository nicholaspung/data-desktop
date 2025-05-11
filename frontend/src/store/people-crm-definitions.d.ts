// frontend/src/store/people-crm-definitions.d.ts

// Person entity
export interface Person {
  id: string;
  name: string;
  birthday?: Date;
  address?: string;
  employment_history?: string; // Markdown list of occupations/companies
  tags?: string;
  first_met_date?: Date;

  // Metadata
  createdAt: Date;
  lastModified: Date;
  private: boolean;
}

// Meeting/Interaction entity
export interface Meeting {
  id: string;
  person_id: string;
  person_id_data?: Person;
  meeting_date: Date;
  location: string;
  location_type?: string; // Changed to string for autocomplete
  duration_minutes?: number;
  participants?: string;
  description?: string;
  tags?: string;
  feelings?: string;
  follow_up_needed?: boolean;
  follow_up_date?: Date;

  // Metadata
  createdAt: Date;
  lastModified: Date;
  private: boolean;
}

export enum MeetingLocationType {
  RESTAURANT = "restaurant",
  HOME = "home",
  OFFICE = "office",
  VIRTUAL = "virtual",
  COFFEE_SHOP = "coffee_shop",
  OUTDOOR = "outdoor",
  OTHER = "other",
}

// Person Attributes - random trackable attributes about a person
export interface PersonAttribute {
  id: string;
  person_id: string;
  person_id_data?: Person;
  attribute_name: string;
  attribute_value: string;
  category?: string; // Like "preferences", "hobbies", "facts", etc
  learned_date?: Date;
  notes?: string;
  source?: string; // Where did you learn this

  // Metadata
  createdAt: Date;
  lastModified: Date;
  private: boolean;
}

// Daily Notes for a person
export interface PersonNote {
  id: string;
  person_id: string;
  person_id_data?: Person;
  note_date: Date;
  content: string;
  category?: string; // "general", "important", "reminder", etc
  tags?: string;

  // Metadata
  createdAt: Date;
  lastModified: Date;
  private: boolean;
}

// Birthday reminders
export interface BirthdayReminder {
  id: string;
  person_id: string;
  person_id_data?: Person;
  reminder_date: Date;
  advance_days: number;
  reminder_note?: string;

  // Metadata
  createdAt: Date;
  lastModified: Date;
}

// Relationship tracking
export interface PersonRelationship {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: string; // "colleague", "friend", "family", "mentor", etc
  description?: string;
  since_date?: Date;

  // Metadata
  createdAt: Date;
  lastModified: Date;
}

// Partial types
export type PartialPerson = Partial<Person>;
export type PartialMeeting = Partial<Meeting>;
export type PartialPersonAttribute = Partial<PersonAttribute>;
export type PartialPersonNote = Partial<PersonNote>;
export type PartialBirthdayReminder = Partial<BirthdayReminder>;
export type PartialPersonRelationship = Partial<PersonRelationship>;

// Input types (for creating new records)
export type PersonInput = Omit<Person, "id" | "createdAt" | "lastModified">;
export type MeetingInput = Omit<
  Meeting,
  "id" | "createdAt" | "lastModified" | "person_id_data"
>;
export type PersonAttributeInput = Omit<
  PersonAttribute,
  "id" | "createdAt" | "lastModified" | "person_id_data"
>;
export type PersonNoteInput = Omit<
  PersonNote,
  "id" | "createdAt" | "lastModified" | "person_id_data"
>;
export type BirthdayReminderInput = Omit<
  BirthdayReminder,
  "id" | "createdAt" | "lastModified" | "person_id_data"
>;
export type PersonRelationshipInput = Omit<
  PersonRelationship,
  "id" | "createdAt" | "lastModified"
>;

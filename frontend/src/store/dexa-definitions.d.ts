// Types for DEXA scan data

export interface DEXAScan {
  // General scan information
  date: Date;
  fasted: boolean;

  // Total body measurements
  total_body_fat_percentage: number;
  total_mass_lbs: number;
  fat_tissue_lbs: number;
  lean_tissue_lbs: number;
  bone_mineral_content: number;

  // Arms region measurements
  arms_total_region_fat_percentage: number;
  arms_total_mass_lbs: number;
  arms_fat_tissue_lbs: number;
  arms_lean_tissue_lbs: number;
  arms_bone_mineral_content: number;

  // Legs region measurements
  legs_total_region_fat_percentage: number;
  legs_total_mass_lbs: number;
  legs_fat_tissue_lbs: number;
  legs_lean_tissue_lbs: number;
  legs_bone_mineral_content: number;

  // Trunk region measurements
  trunk_total_region_fat_percentage: number;
  trunk_total_mass_lbs: number;
  trunk_fat_tissue_lbs: number;
  trunk_lean_tissue_lbs: number;
  trunk_bone_mineral_content: number;

  // Android region measurements
  android_total_region_fat_percentage: number;
  android_total_mass_lbs: number;
  android_fat_tissue_lbs: number;
  android_lean_tissue_lbs: number;
  android_bone_mineral_content: number;

  // Gynoid region measurements
  gynoid_total_region_fat_percentage: number;
  gynoid_total_mass_lbs: number;
  gynoid_fat_tissue_lbs: number;
  gynoid_lean_tissue_lbs: number;
  gynoid_bone_mineral_content: number;

  // Additional measurements
  resting_metabolic_rate: number;
  android: number;
  gynoid: number;
  a_g_ratio: number;
  vat_mass_lbs: number;
  vat_volume_in3: number;

  // Bone density measurements
  bone_density_g_cm2_head: number;
  bone_density_g_cm2_arms: number;
  bone_density_g_cm2_legs: number;
  bone_density_g_cm2_trunk: number;
  bone_density_g_cm2_ribs: number;
  bone_density_g_cm2_spine: number;
  bone_density_g_cm2_pelvis: number;
  bone_density_g_cm2_total: number;

  // Right arm measurements
  right_arm_total_region_fat_percentage: number;
  right_arm_total_mass_lbs: number;
  right_arm_fat_tissue_lbs: number;
  right_arm_lean_tissue_lbs: number;
  right_arm_bone_mineral_content: number;

  // Left arm measurements
  left_arm_total_region_fat_percentage: number;
  left_arm_total_mass_lbs: number;
  left_arm_fat_tissue_lbs: number;
  left_arm_lean_tissue_lbs: number;
  left_arm_bone_mineral_content: number;

  // Right leg measurements
  right_leg_total_region_fat_percentage: number;
  right_leg_total_mass_lbs: number;
  right_leg_fat_tissue_lbs: number;
  right_leg_lean_tissue_lbs: number;
  right_leg_bone_mineral_content: number;

  // Left leg measurements
  left_leg_total_region_fat_percentage: number;
  left_leg_total_mass_lbs: number;
  left_leg_fat_tissue_lbs: number;
  left_leg_lean_tissue_lbs: number;
  left_leg_bone_mineral_content: number;

  // Metadata fields that might be added by the system
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Optional version where all fields are optional
// Useful for partial updates or form state
export type PartialDEXAScan = Partial<DEXAScan>;

// Type for DEXA scan with all fields required except metadata
export type DEXAScanInput = Omit<DEXAScan, "id" | "createdAt" | "lastModified">;

// Type for DEXA field definition that matches your application structure
export type DEXAFieldKey = keyof DEXAScan;

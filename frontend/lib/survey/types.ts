import type { OutingPurpose } from "@/lib/api/types";

export type Duration = "SHORT" | "MEDIUM" | "LONG" | "ALL_DAY";
export type Mobility = "LOW" | "MEDIUM" | "HIGH";
export type StyleMood = "NEAT" | "COMFY" | "STYLISH" | "ACTIVE" | "SIMPLE";
export type ColdSensitivity = "HIGH" | "NORMAL" | "LOW";

export type SurveyFormState = {
  outingPurpose: OutingPurpose;
  duration: Duration;
  mobility: Mobility;
  styleMood: StyleMood;
  coldSensitivity: ColdSensitivity;
  notes: string;
};

export const DEFAULT_SURVEY_FORM_STATE: SurveyFormState = {
  outingPurpose: "CASUAL",
  duration: "MEDIUM",
  mobility: "MEDIUM",
  styleMood: "COMFY",
  coldSensitivity: "NORMAL",
  notes: ""
};

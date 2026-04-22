import {
  COLD_SENSITIVITY_LABELS,
  DURATION_LABELS,
  MOBILITY_LABELS,
  OUTING_PURPOSE_LABELS,
  STYLE_MOOD_LABELS
} from "./options";
import type { SurveyFormState } from "./types";

export function buildRecommendationPrompt(formState: SurveyFormState) {
  const purpose = OUTING_PURPOSE_LABELS[formState.outingPurpose];
  const duration = DURATION_LABELS[formState.duration];
  const mobility = MOBILITY_LABELS[formState.mobility];
  const styleMood = STYLE_MOOD_LABELS[formState.styleMood];
  const coldSensitivity = COLD_SENSITIVITY_LABELS[formState.coldSensitivity];

  const notesSegment =
    formState.notes.trim().length > 0 ? ` 추가 요청사항은 "${formState.notes.trim()}"입니다.` : "";

  return `오늘 외출 목적은 ${purpose}이고, ${duration} 외출하며 이동량은 ${mobility}이고, 스타일은 ${styleMood}를 원하고, 추위를 ${coldSensitivity} 사용자입니다.${notesSegment}`;
}

// TODO: Later step - send this prompt to AI recommendation service.

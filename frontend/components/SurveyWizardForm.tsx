import {
  COLD_SENSITIVITY_OPTIONS,
  DURATION_OPTIONS,
  MOBILITY_OPTIONS,
  OUTING_PURPOSE_OPTIONS,
  STYLE_MOOD_OPTIONS
} from "@/lib/survey/options";
import type { SurveyFormState } from "@/lib/survey/types";
import { useState } from "react";
import { SurveyQuestionCard } from "./SurveyQuestionCard";

type Props = {
  initialValue: SurveyFormState;
  loading: boolean;
  onSubmit: (state: SurveyFormState) => Promise<void>;
};

export function SurveyWizardForm({ initialValue, loading, onSubmit }: Props) {
  const [form, setForm] = useState<SurveyFormState>(initialValue);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="sectionCard form" onSubmit={submit}>
      <h2>오늘 추천을 위한 설문</h2>

      <SurveyQuestionCard
        title="1. 오늘 외출 목적은 무엇인가요?"
        name="outingPurpose"
        value={form.outingPurpose}
        options={OUTING_PURPOSE_OPTIONS}
        disabled={loading}
        onChange={(outingPurpose) => setForm((prev) => ({ ...prev, outingPurpose }))}
      />
      <SurveyQuestionCard
        title="2. 외출 시간은 얼마나 되나요?"
        name="duration"
        value={form.duration}
        options={DURATION_OPTIONS}
        disabled={loading}
        onChange={(duration) => setForm((prev) => ({ ...prev, duration }))}
      />
      <SurveyQuestionCard
        title="3. 이동량은 어느 정도인가요?"
        name="mobility"
        value={form.mobility}
        options={MOBILITY_OPTIONS}
        disabled={loading}
        onChange={(mobility) => setForm((prev) => ({ ...prev, mobility }))}
      />
      <SurveyQuestionCard
        title="4. 원하는 스타일 분위기는 무엇인가요?"
        name="styleMood"
        value={form.styleMood}
        options={STYLE_MOOD_OPTIONS}
        disabled={loading}
        onChange={(styleMood) => setForm((prev) => ({ ...prev, styleMood }))}
      />
      <SurveyQuestionCard
        title="5. 추위를 얼마나 타시나요?"
        name="coldSensitivity"
        value={form.coldSensitivity}
        options={COLD_SENSITIVITY_OPTIONS}
        disabled={loading}
        onChange={(coldSensitivity) => setForm((prev) => ({ ...prev, coldSensitivity }))}
      />

      <label className="field">
        <span>추가 메모 (선택)</span>
        <textarea
          className="input textarea"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="예: 실내 이동이 많고 비바람이 걱정돼요"
          maxLength={255}
          disabled={loading}
        />
      </label>

      <button className="primaryBtn" type="submit" disabled={loading}>
        {loading ? "제출 중..." : "설문 제출"}
      </button>
    </form>
  );
}

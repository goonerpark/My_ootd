import type { OutingPurpose, UpsertSurveyPayload } from "@/lib/api/types";
import { useState } from "react";

type Props = {
  initialPurpose: OutingPurpose;
  initialNotes: string;
  loading: boolean;
  onSubmit: (payload: UpsertSurveyPayload) => Promise<void>;
};

const PURPOSE_OPTIONS: Array<{ value: OutingPurpose; label: string }> = [
  { value: "WORK", label: "출근" },
  { value: "SCHOOL", label: "등교" },
  { value: "DATE", label: "데이트" },
  { value: "EXERCISE", label: "운동" },
  { value: "FORMAL", label: "격식 있는 자리" },
  { value: "TRAVEL", label: "여행" },
  { value: "CASUAL", label: "가벼운 외출" },
  { value: "QUICK_OUTING", label: "잠깐 외출" }
];

export function SurveyForm({ initialPurpose, initialNotes, loading, onSubmit }: Props) {
  const [outingPurpose, setOutingPurpose] = useState<OutingPurpose>(initialPurpose);
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      outingPurpose,
      notes: notes.trim().length > 0 ? notes.trim() : undefined
    });
  };

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>오늘 외출 목적 설문</h2>
      <label className="field">
        <span>외출 목적(TPO)</span>
        <select
          className="input"
          value={outingPurpose}
          onChange={(event) => setOutingPurpose(event.target.value as OutingPurpose)}
          disabled={loading}
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>메모 (선택)</span>
        <textarea
          className="input textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={255}
          placeholder="예: 미팅이 많아서 단정한 느낌 원해요."
          disabled={loading}
        />
      </label>

      <button className="primaryBtn" type="submit" disabled={loading}>
        {loading ? "저장 중..." : "설문 저장"}
      </button>
    </form>
  );
}

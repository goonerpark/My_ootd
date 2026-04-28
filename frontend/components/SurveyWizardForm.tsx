import type { FormEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Briefcase,
  Clock,
  Coffee,
  Dumbbell,
  Edit3,
  GraduationCap,
  Heart,
  Landmark,
  Plane,
  Shirt,
  Snowflake,
  Sparkles,
  Timer,
  UserCheck,
  Zap
} from "lucide-react";
import {
  COLD_SENSITIVITY_OPTIONS,
  DURATION_OPTIONS,
  MOBILITY_OPTIONS,
  OUTING_PURPOSE_OPTIONS,
  STYLE_MOOD_OPTIONS
} from "@/lib/survey/options";
import type { SurveyFormState } from "@/lib/survey/types";

type Props = {
  initialValue: SurveyFormState;
  loading: boolean;
  onSubmit: (state: SurveyFormState) => Promise<void>;
};

type Option<T extends string> = {
  value: T;
  label: string;
};

const ICONS: Record<string, LucideIcon> = {
  WORK: Briefcase,
  SCHOOL: GraduationCap,
  DATE: Heart,
  EXERCISE: Dumbbell,
  FORMAL: Landmark,
  TRAVEL: Plane,
  CASUAL: Coffee,
  QUICK_OUTING: Timer,
  SHORT: Clock,
  MEDIUM: Timer,
  LONG: UserCheck,
  ALL_DAY: Sparkles,
  LOW: Coffee,
  HIGH: Zap,
  NEAT: Shirt,
  COMFY: Coffee,
  STYLISH: Sparkles,
  ACTIVE: Bike,
  SIMPLE: UserCheck,
  NORMAL: Snowflake
};

function OptionButton<T extends string>({
  option,
  selected,
  disabled,
  onClick
}: {
  option: Option<T>;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[option.value] ?? Sparkles;

  return (
    <button
      className={[
        "flex min-h-24 flex-col items-center justify-center rounded-xl border p-4 text-center transition-all",
        selected ? "border-2 border-primary bg-primary/5 text-primary" : "border-surface-container-high text-secondary hover:border-primary/50",
        disabled ? "cursor-not-allowed opacity-60" : ""
      ].join(" ")}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="mb-2" size={28} />
      <span className="font-label-sm text-label-sm">{option.label}</span>
    </button>
  );
}

function QuestionSection<T extends string>({
  index,
  title,
  value,
  options,
  disabled,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-3"
}: {
  index: number;
  title: string;
  value: T;
  options: Array<Option<T>>;
  disabled: boolean;
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <section className="rounded-xl border border-surface-container bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{index}</span>
        <h3 className="font-title-sm text-title-sm">{title}</h3>
      </div>
      <div className={`grid gap-4 ${columns}`}>
        {options.map((option) => (
          <OptionButton
            key={option.value}
            option={option}
            selected={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </section>
  );
}

export function SurveyWizardForm({ initialValue, loading, onSubmit }: Props) {
  const [form, setForm] = useState<SurveyFormState>(initialValue);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="space-y-10" onSubmit={submit}>
      <div>
        <div className="mb-3 flex items-end justify-between">
          <span className="font-label-sm text-label-sm font-bold text-primary">진행도 5 / 5</span>
          <span className="font-caption-xs text-caption-xs text-on-secondary-container">거의 다 왔어요!</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-full bg-primary transition-all duration-500 ease-out" />
        </div>
      </div>

      <QuestionSection
        index={1}
        title="오늘의 외출 목적은 무엇인가요?"
        value={form.outingPurpose}
        options={OUTING_PURPOSE_OPTIONS}
        disabled={loading}
        onChange={(outingPurpose) => setForm((prev) => ({ ...prev, outingPurpose }))}
      />

      <QuestionSection
        index={2}
        title="야외 활동 시간이 어느 정도인가요?"
        value={form.duration}
        options={DURATION_OPTIONS}
        disabled={loading}
        columns="grid-cols-1 sm:grid-cols-2"
        onChange={(duration) => setForm((prev) => ({ ...prev, duration }))}
      />

      <QuestionSection
        index={3}
        title="오늘의 이동량은 어느 정도인가요?"
        value={form.mobility}
        options={MOBILITY_OPTIONS}
        disabled={loading}
        columns="grid-cols-1 sm:grid-cols-3"
        onChange={(mobility) => setForm((prev) => ({ ...prev, mobility }))}
      />

      <QuestionSection
        index={4}
        title="선호하는 스타일 무드를 선택하세요"
        value={form.styleMood}
        options={STYLE_MOOD_OPTIONS}
        disabled={loading}
        onChange={(styleMood) => setForm((prev) => ({ ...prev, styleMood }))}
      />

      <QuestionSection
        index={5}
        title="추위를 얼마나 타시나요?"
        value={form.coldSensitivity}
        options={COLD_SENSITIVITY_OPTIONS}
        disabled={loading}
        columns="grid-cols-1 sm:grid-cols-3"
        onChange={(coldSensitivity) => setForm((prev) => ({ ...prev, coldSensitivity }))}
      />

      <section className="rounded-xl border border-surface-container bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-3">
          <Edit3 className="text-secondary" size={22} />
          <h3 className="font-title-sm text-title-sm">추가로 고려할 사항이 있나요?</h3>
        </div>
        <textarea
          className="w-full resize-none rounded-xl border border-surface-container-high p-4 text-body-md outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="예: 오늘은 미팅이 있어서 좀 더 단정하게 입고 싶어요. 비가 올 것 같으니 방수가 되는 신발이면 좋겠어요."
          maxLength={255}
          rows={4}
          disabled={loading}
        />
      </section>

      <div className="pt-2">
        <button
          className="flex w-full items-center justify-center gap-4 rounded-2xl bg-primary py-6 font-headline-md text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? "AI 추천 요청 중..." : "AI 추천 받기"}</span>
          <Sparkles size={24} />
        </button>
        <p className="mt-6 text-center font-caption-xs text-caption-xs text-on-secondary-container">
          기상 정보와 사용자님의 성향을 분석하여 최적의 착장을 생성합니다.
        </p>
      </div>
    </form>
  );
}

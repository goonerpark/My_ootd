"use client";

import { RECOMMENDATION_FEEDBACK_OPTIONS, type RecommendationFeedbackValue } from "@/lib/recommendation/feedback";

type Props = {
  selected?: RecommendationFeedbackValue | null;
  onSelect: (value: RecommendationFeedbackValue) => void;
  compact?: boolean;
};

export function RecommendationFeedbackPanel({ selected = null, onSelect, compact = false }: Props) {
  return (
    <section className={compact ? "mt-5 rounded-2xl bg-white/10 p-4" : "rounded-2xl border border-surface-container bg-white p-5 shadow-soft"}>
      <div className="mb-3">
        <h3 className={compact ? "text-sm font-bold text-white" : "font-bold text-primary"}>{"\uCD94\uCC9C\uC774 \uC5B4\uB560\uB098\uC694?"}</h3>
        <p className={compact ? "mt-1 text-xs text-slate-200" : "mt-1 text-sm text-on-surface-variant"}>
          {"\uC120\uD0DD\uD55C \uD53C\uB4DC\uBC31\uC740 \uB2E4\uC74C \uC124\uBB38 \uBA54\uBAA8\uC5D0 \uBC18\uC601\uB418\uC5B4 \uCD94\uCC9C \uD488\uC9C8\uC744 \uB192\uC5EC\uC694."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {RECOMMENDATION_FEEDBACK_OPTIONS.map((option) => {
          const active = selected === option.value;
          const baseClass = compact
            ? "border-white/20 text-white hover:bg-white/20"
            : "border-surface-container-high text-secondary hover:border-primary hover:text-primary";
          const activeClass = compact ? "bg-white text-primary border-white" : "bg-primary text-white border-primary";

          return (
            <button
              className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${active ? activeClass : baseClass}`}
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

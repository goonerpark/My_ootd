type Props = {
  title?: string;
  description: string;
};

export function EmptyState({ title = "데이터가 없습니다.", description }: Props) {
  return (
    <div className="stateBox stateEmpty" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

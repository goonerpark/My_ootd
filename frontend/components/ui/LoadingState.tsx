type Props = {
  label?: string;
};

export function LoadingState({ label = "불러오는 중입니다..." }: Props) {
  return (
    <div className="stateBox stateLoading" role="status" aria-live="polite">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

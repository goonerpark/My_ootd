type Props = {
  message: string;
};

export function ErrorMessage({ message }: Props) {
  return (
    <div className="stateBox stateError" role="alert" aria-live="assertive">
      <strong>문제가 발생했습니다.</strong>
      <p>{message}</p>
    </div>
  );
}

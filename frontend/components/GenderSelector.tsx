import type { Gender } from "@/lib/api/types";

type Props = {
  value: Gender;
  onChange: (value: Gender) => void;
};

export function GenderSelector({ value, onChange }: Props) {
  return (
    <div className="panel">
      <h2>성별</h2>
      <div className="row">
        <button
          className={value === "MALE" ? "toggle active" : "toggle"}
          onClick={() => onChange("MALE")}
          type="button"
        >
          남성
        </button>
        <button
          className={value === "FEMALE" ? "toggle active" : "toggle"}
          onClick={() => onChange("FEMALE")}
          type="button"
        >
          여성
        </button>
      </div>
    </div>
  );
}

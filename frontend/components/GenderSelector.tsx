import type { Gender } from "@/lib/api/types";

type Props = {
  value: Gender;
  onChange: (value: Gender) => void;
};

export function GenderSelector({ value, onChange }: Props) {
  return (
    <section className="sectionCard">
      <h2>성별 선택</h2>
      <div className="row">
        <button className={value === "MALE" ? "toggle active" : "toggle"} onClick={() => onChange("MALE")} type="button">
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
    </section>
  );
}

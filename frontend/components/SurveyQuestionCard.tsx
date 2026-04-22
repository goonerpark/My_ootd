type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  title: string;
  name: string;
  value: T;
  options: Array<Option<T>>;
  disabled?: boolean;
  onChange: (value: T) => void;
};

export function SurveyQuestionCard<T extends string>({
  title,
  name,
  value,
  options,
  disabled,
  onChange
}: Props<T>) {
  return (
    <section className="questionCard">
      <h3>{title}</h3>
      <div className="choiceGrid">
        {options.map((option) => (
          <label key={option.value} className={value === option.value ? "choice active" : "choice"}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

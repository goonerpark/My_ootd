import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function SecondaryButton({ className, type = "button", ...props }: Props) {
  return <button type={type} className={`btn btnSecondary${className ? ` ${className}` : ""}`} {...props} />;
}

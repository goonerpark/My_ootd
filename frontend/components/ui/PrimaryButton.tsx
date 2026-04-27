import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, type = "button", ...props }: Props) {
  return <button type={type} className={`btn btnPrimary${className ? ` ${className}` : ""}`} {...props} />;
}

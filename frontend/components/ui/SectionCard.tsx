import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, children, className }: Props) {
  return (
    <section className={`sectionCard${className ? ` ${className}` : ""}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

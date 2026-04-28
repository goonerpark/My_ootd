import { ReactNode } from "react";
import { AppLogo } from "./AppLogo";

type Props = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="pageHeader">
      <div>
        <AppLogo size="md" />
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="pageHeaderAction">{action}</div>}
    </header>
  );
}

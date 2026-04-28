import { ReactNode } from 'react';
import { BottomNav, SideNav, TopNav } from './NavBars';

type AppShellProps = {
  activePath: string;
  children: ReactNode;
};

export function AppShell({ activePath, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-on-surface">
      <TopNav activePath={activePath} />
      <SideNav activePath={activePath} />
      <main className="min-h-screen pb-32 pt-24 md:ml-72 md:pb-10 md:pt-20">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-8">{children}</div>
      </main>
      <BottomNav activePath={activePath} />
    </div>
  );
}

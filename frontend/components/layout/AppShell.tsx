import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  activePath: string;
  children: ReactNode;
  withFooter?: boolean;
  contentClassName?: string;
};

export function AppShell({ activePath, children, withFooter = false, contentClassName = '' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar activePath={activePath} />
      <Header />
      <main className={`min-h-screen pb-24 lg:ml-64 lg:pb-12 ${contentClassName}`}>{children}</main>
      {withFooter && <Footer />}
      <BottomNav activePath={activePath} />
    </div>
  );
}
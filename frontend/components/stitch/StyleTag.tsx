export function StyleTag({ children }: { children: string }) {
  return <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{children}</span>;
}

import type { ClosetItem } from '@/lib/api/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function normalizeImageUrl(url: string) {
  if (url.startsWith('local://closet-items/')) {
    const filename = url.replace('local://closet-items/', '');
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

export function WardrobeGrid({ items }: { items: ClosetItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
          <div className="aspect-[3/4] w-full bg-zinc-100">
            <img src={normalizeImageUrl(item.imageUrl)} alt={item.subcategory ?? item.category} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2 p-3">
            <p className="text-sm font-semibold text-zinc-900">{item.subcategory ?? item.category}</p>
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">{item.category}</span>
              {item.color ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">{item.color}</span> : null}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">{item.fit}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

import Image from 'next/image';

type OutfitCardProps = {
  title: string;
  imageUrl: string;
  subtitle?: string;
  badge?: string;
};

export function OutfitCard({ title, imageUrl, subtitle, badge }: OutfitCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft transition hover:shadow-card">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
        <Image src={imageUrl} alt={title} fill className="object-cover transition duration-700 group-hover:scale-105" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {subtitle ? <p className="text-xs text-zinc-500">{subtitle}</p> : null}
      </div>
    </article>
  );
}

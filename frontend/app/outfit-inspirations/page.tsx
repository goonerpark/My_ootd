'use client';

import Link from 'next/link';
import { Heart, Sparkles, ThumbsUp, WandSparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout';
import { fetchOutfitInspirations } from '@/lib/api/client';
import type { LookCategory, OotdPostSummary } from '@/lib/api/types';
import { lookCategoryFilters, lookCategoryLabels } from '@/lib/community/categories';

function InspirationCard({ post }: { post: OotdPostSummary }) {
  return (
    <Link href={`/ootd-posts/${post.postId}`} className="group flex cursor-pointer flex-col">
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        {post.thumbnailUrl ? (
          <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={post.thumbnailUrl} alt="추천 코디" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-on-surface-variant">
            <WandSparkles size={40} />
            <span className="text-sm font-semibold">이미지 없음</span>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">@{post.authorNickname}</div>
        <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-error shadow-lg backdrop-blur-md">
          <Heart size={19} fill="currentColor" />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-start justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">오늘 이런 옷차림도 좋아요</h3>
          <div className="flex items-center gap-1 text-sm text-on-surface-variant"><ThumbsUp size={14} />{post.likeCount}</div>
        </div>
        <p className="mb-3 text-sm text-on-surface-variant">#{lookCategoryLabels[post.lookCategory] ?? post.lookCategory} #Daily #my_ootd</p>
        <span className="text-xs text-on-surface-variant">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-[2rem] border border-dashed border-outline-variant bg-white p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <WandSparkles size={34} />
      </div>
      <h2 className="font-headline text-2xl font-bold text-primary">추천할 코디가 아직 없습니다</h2>
      <p className="mt-3 text-on-surface-variant">좋아요 5개 이상 받은 OOTD가 생기면 이곳에 표시됩니다.</p>
      <Link href="/ootd-board" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-sm transition hover:opacity-90">
        OOTD 보러가기
      </Link>
    </div>
  );
}

export default function OutfitInspirationsPage() {
  const [category, setCategory] = useState<LookCategory | ''>('');
  const [posts, setPosts] = useState<OotdPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const page = await fetchOutfitInspirations({ size: 18, lookCategory: category || undefined });
        if (!ignore) setPosts(page.content ?? []);
      } catch {
        if (!ignore) {
          setPosts([]);
          setErrorMessage('추천 코디를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [category]);

  return (
    <AppShell activePath="/outfit-inspirations" withFooter>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-10">
        <section className="mb-10">
          <div className="max-w-2xl">
            <h1 className="font-headline text-4xl font-bold text-on-background">오늘의 코디 추천</h1>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              좋아요 5개 이상 받은 실제 커뮤니티 룩만 모았습니다. <span className="font-semibold text-primary">오늘 이런 옷차림도 좋아요.</span>
            </p>
          </div>
        </section>

        <section className="sticky top-[72px] z-20 mb-10 bg-background/80 py-4 backdrop-blur-md">
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {lookCategoryFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setCategory(filter.value)}
                className={category === filter.value ? 'whitespace-nowrap rounded-full bg-primary-container px-6 py-2 text-sm font-semibold text-on-primary-container shadow-md' : 'whitespace-nowrap rounded-full border border-outline-variant bg-white px-6 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low'}
              >
                {filter.label === 'All' ? 'All Recommended' : filter.label}
              </button>
            ))}
          </div>
        </section>

        {loading && <p className="mb-4 flex items-center gap-2 text-sm text-stone-400"><Sparkles size={15} />추천 피드를 불러오는 중입니다...</p>}
        {errorMessage && <div className="mb-6 rounded-2xl border border-error-container bg-error-container/25 p-4 text-sm text-on-error-container">{errorMessage}</div>}

        <section className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {!loading && posts.length === 0 ? <EmptyState /> : posts.map((post) => <InspirationCard key={post.postId} post={post} />)}
        </section>
      </div>
    </AppShell>
  );
}
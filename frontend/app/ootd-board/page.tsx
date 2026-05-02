'use client';

import Link from 'next/link';
import { Eye, Heart, Images, Shirt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout';
import { fetchOotdPosts } from '@/lib/api/client';
import type { LookCategory, OotdPostSummary } from '@/lib/api/types';
import { lookCategoryFilters, lookCategoryLabels } from '@/lib/community/categories';

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function PostCard({ post }: { post: OotdPostSummary }) {
  return (
    <Link href={`/ootd-posts/${post.postId}`} className="group block">
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={`${post.authorNickname} OOTD`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Shirt size={40} />
            <span className="text-sm font-semibold">이미지 없음</span>
          </div>
        )}
        {post.hasMultipleImages && (
          <div className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white backdrop-blur-md">
            <Images size={18} />
          </div>
        )}
        <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A6D5E] backdrop-blur">
          {lookCategoryLabels[post.lookCategory] ?? post.lookCategory}
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold text-on-surface">@{post.authorNickname}</p>
          <p className="text-[11px] text-stone-400">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
        <div className="flex gap-4 text-stone-400">
          <span className="flex items-center gap-1 text-xs font-medium"><Heart size={17} />{formatCount(post.likeCount)}</span>
          <span className="flex items-center gap-1 text-xs font-medium"><Eye size={17} />{formatCount(post.viewCount)}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-[2rem] border border-dashed border-outline-variant bg-white p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <Shirt size={34} />
      </div>
      <h2 className="font-headline text-2xl font-bold text-primary">아직 등록된 OOTD가 없습니다 👕</h2>
      <p className="mt-3 text-on-surface-variant">첫 번째 게시글을 작성해보세요!</p>
      <Link href="/ootd-upload" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-sm transition hover:opacity-90">
        Post OOTD
      </Link>
    </div>
  );
}

export default function OotdBoardPage() {
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
        const page = await fetchOotdPosts({ size: 24, lookCategory: category || undefined });
        if (!ignore) setPosts(page.content ?? []);
      } catch {
        if (!ignore) {
          setPosts([]);
          setErrorMessage('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [category]);

  return (
    <AppShell activePath="/ootd-board" withFooter>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-background">오늘의 OOTD</h1>
            <p className="mt-2 max-w-lg text-on-surface-variant">사용자들이 공유한 실제 데일리룩을 확인하고 취향을 발견하세요.</p>
          </div>
          <Link href="/ootd-upload" className="w-fit rounded-full bg-primary-container px-6 py-3 font-bold text-on-primary-container shadow-md">
            Post OOTD
          </Link>
        </section>

        <section className="mb-8 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {lookCategoryFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={[
                'whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold transition',
                category === filter.value ? 'bg-primary-container text-on-primary-container shadow-md' : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
              ].join(' ')}
            >
              {filter.label}
            </button>
          ))}
        </section>

        {loading && <p className="mb-4 text-sm text-stone-400">게시글을 불러오는 중입니다...</p>}
        {errorMessage && <div className="mb-6 rounded-2xl border border-error-container bg-error-container/25 p-4 text-sm text-on-error-container">{errorMessage}</div>}

        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {!loading && posts.length === 0 ? <EmptyState /> : posts.map((post) => <PostCard key={post.postId} post={post} />)}
        </section>
      </div>
    </AppShell>
  );
}
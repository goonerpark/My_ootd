'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Shirt } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { createOotdPostComment, fetchOotdPostDetail, toggleOotdPostLike } from '@/lib/api/client';
import type { OotdPostDetail } from '@/lib/api/types';
import { getAccessTokenFromStorage } from '@/lib/auth/token';

function Avatar({ imageUrl, name, size = 'h-12 w-12' }: { imageUrl?: string | null; name: string; size?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${size} rounded-full border border-stone-100 object-cover`} />;
  return <div className={`${size} flex items-center justify-center rounded-full border border-stone-100 bg-primary-container/20 text-sm font-bold text-primary`}>{name.slice(0, 1).toUpperCase()}</div>;
}

export default function OotdPostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const [post, setPost] = useState<OotdPostDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!Number.isFinite(postId)) return;
      setLoading(true);
      setErrorMessage(null);
      try {
        const detail = await fetchOotdPostDetail(postId);
        if (!ignore) {
          setPost(detail);
          setActiveImageIndex(0);
        }
      } catch {
        if (!ignore) {
          setPost(null);
          setErrorMessage('게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [postId]);

  const activeImage = post?.images[activeImageIndex] ?? post?.images[0];
  const brandRows = useMemo(() => post?.images.flatMap((image) => image.brandTags) ?? [], [post?.images]);

  const like = async () => {
    if (!post) return;
    if (!token) {
      setMessage('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }
    try {
      const result = await toggleOotdPostLike(token, post.postId);
      setPost((prev) => prev ? { ...prev, likeCount: result.likeCount } : prev);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '좋아요 처리에 실패했습니다.');
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!post) return;
    if (!token) {
      setMessage('로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }
    if (!comment.trim()) return;
    try {
      const created = await createOotdPostComment(token, post.postId, comment.trim());
      setPost((prev) => prev ? { ...prev, comments: [...prev.comments, created] } : prev);
      setComment('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '댓글 작성에 실패했습니다.');
    }
  };

  if (loading) {
    return <AppShell activePath="/ootd-board" withFooter><div className="mx-auto max-w-[1200px] px-4 py-10 text-stone-400">게시글을 불러오는 중입니다...</div></AppShell>;
  }

  if (!post) {
    return (
      <AppShell activePath="/ootd-board" withFooter>
        <div className="mx-auto max-w-[900px] px-4 py-16">
          <div className="rounded-[2rem] border border-dashed border-outline-variant bg-white p-12 text-center">
            <Shirt className="mx-auto mb-4 text-primary" size={40} />
            <h1 className="font-headline text-2xl font-bold text-primary">게시글을 찾을 수 없습니다</h1>
            <p className="mt-3 text-on-surface-variant">{errorMessage ?? '삭제되었거나 존재하지 않는 게시글입니다.'}</p>
            <Link href="/ootd-board" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-on-primary">게시판으로 돌아가기</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/ootd-board" withFooter>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-10 md:py-10">
        <Link href="/ootd-board" className="mb-6 flex items-center gap-2 text-stone-400 lg:hidden">
          <ChevronLeft size={18} /> Back to Board
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <section className="group relative lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              {activeImage ? (
                <img className="aspect-[4/5] h-auto w-full object-cover" src={activeImage.imageUrl} alt="OOTD 상세 이미지" />
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 text-on-surface-variant"><Shirt size={42} />이미지가 없습니다</div>
              )}
              {activeImage?.brandTags.map((tag) => (
                <a key={tag.brandTagId} href={tag.shopUrl ?? '#'} target={tag.shopUrl ? '_blank' : undefined} className="absolute cursor-pointer active:scale-95" style={{ left: `${tag.positionX}%`, top: `${tag.positionY}%` }}>
                  <div className="flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-primary-fixed" />
                    {tag.brandName}
                    <ChevronRight size={14} />
                  </div>
                </a>
              ))}
              {post.images.length > 1 && (
                <>
                  <button type="button" onClick={() => setActiveImageIndex((value) => Math.max(0, value - 1))} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur">
                    <ChevronLeft />
                  </button>
                  <button type="button" onClick={() => setActiveImageIndex((value) => Math.min(post.images.length - 1, value + 1))} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur">
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar imageUrl={post.authorProfileImageUrl} name={post.authorNickname} />
                <div>
                  <h1 className="font-headline text-base font-bold text-on-surface">{post.authorNickname}</h1>
                  <p className="text-sm text-stone-400">my_ootd member</p>
                </div>
              </div>
              <button className="rounded-full bg-surface-container-low px-6 py-2 text-sm font-semibold text-primary">Follow</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-100 pb-6">
                <button type="button" onClick={like} className="flex items-center gap-2">
                  <Heart className="text-error" fill="currentColor" />
                  <span className="font-bold">{post.likeCount}</span>
                </button>
                <div className="flex items-center gap-2"><MessageCircle className="text-stone-400" /><span className="font-bold">{post.comments.length}</span></div>
                <Bookmark className="ml-auto text-stone-400" />
              </div>

              <p className="leading-relaxed text-on-surface">{post.caption}</p>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag) => (
                  <Link key={tag} href={`/ootd-board?hashtag=${encodeURIComponent(tag)}`} className="font-medium text-primary-container">#{tag}</Link>
                ))}
              </div>
              <p className="text-xs text-stone-400">조회수 {post.viewCount}회 · {new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>

            <div className="space-y-3 rounded-xl bg-surface-container-low p-5">
              <h2 className="text-sm font-bold text-[#5A6D5E]">브랜드 정보</h2>
              {brandRows.length === 0 ? <p className="text-sm text-stone-500">등록된 브랜드 태그가 없습니다.</p> : brandRows.map((tag) => (
                <a key={tag.brandTagId} href={tag.shopUrl ?? '#'} target={tag.shopUrl ? '_blank' : undefined} className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Brand</span>
                  <span className="font-medium text-on-surface">{tag.brandName}</span>
                </a>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-on-surface">댓글 ({post.comments.length})</h2>
              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                {post.comments.length === 0 && <p className="text-sm text-stone-500">아직 댓글이 없습니다.</p>}
                {post.comments.map((item) => (
                  <div key={item.commentId} className="flex gap-3">
                    <Avatar imageUrl={item.authorProfileImageUrl} name={item.authorNickname} size="h-8 w-8" />
                    <div>
                      <p className="text-sm"><span className="font-bold">{item.authorNickname}</span> {item.content}</p>
                      <p className="text-[10px] text-stone-400">{new Date(item.createdAt).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={submitComment} className="relative pt-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-full border border-stone-200 bg-white px-6 py-3 text-sm outline-none transition focus:border-primary-container" placeholder="댓글을 입력하세요..." />
                <button type="submit" className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm font-bold text-primary"><Send size={14} />게시</button>
              </form>
              {message && <p className="text-sm text-error">{message}</p>}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
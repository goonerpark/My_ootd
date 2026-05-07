'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, Pencil, Send, Shirt, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { createOotdPostComment, deleteOotdPost, deleteOotdPostComment, fetchOotdPostDetail, toggleOotdPostLike } from '@/lib/api/client';
import type { OotdComment, OotdPostDetail } from '@/lib/api/types';
import { getAccessTokenFromStorage, getAuthUserProfileFromStorage } from '@/lib/auth/token';

function Avatar({ imageUrl, name, size = 'h-12 w-12' }: { imageUrl?: string | null; name: string; size?: string }) {
  if (imageUrl) {
    return (
      <span className={`${size} relative block overflow-hidden rounded-full border border-stone-100`}>
        <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
      </span>
    );
  }
  return <div className={`${size} flex items-center justify-center rounded-full border border-stone-100 bg-primary-container/20 text-sm font-bold text-primary`}>{name.slice(0, 1).toUpperCase()}</div>;
}

function countComments(comments: OotdComment[]): number {
  return comments.reduce((total, item) => total + 1 + countComments(item.replies ?? []), 0);
}

function appendComment(comments: OotdComment[], created: OotdComment): OotdComment[] {
  if (!created.parentCommentId) {
    return [...comments, { ...created, replies: created.replies ?? [] }];
  }

  return comments.map((item) => {
    if (item.commentId === created.parentCommentId) {
      return { ...item, replies: [...(item.replies ?? []), { ...created, replies: created.replies ?? [] }] };
    }
    return { ...item, replies: appendComment(item.replies ?? [], created) };
  });
}

function removeComment(comments: OotdComment[], commentId: number): OotdComment[] {
  return comments
    .filter((item) => item.commentId !== commentId)
    .map((item) => ({ ...item, replies: removeComment(item.replies ?? [], commentId) }));
}

export default function OotdPostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const [post, setPost] = useState<OotdPostDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<OotdComment | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBrandTags, setShowBrandTags] = useState(false);

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
    setCurrentUserId(getAuthUserProfileFromStorage()?.userId ?? null);
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!Number.isFinite(postId)) return;
      setLoading(true);
      setErrorMessage(null);
      try {
        const currentToken = getAccessTokenFromStorage();
        const detail = await fetchOotdPostDetail(postId, currentToken);
        if (!ignore) {
          setPost(detail);
          setActiveImageIndex(0);
          setShowBrandTags(false);
          setLiked(detail.likedByMe);
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
    return () => {
      ignore = true;
    };
  }, [postId]);

  const activeImage = post?.images[activeImageIndex] ?? post?.images[0];
  const brandRows = useMemo(() => post?.images.flatMap((image) => image.brandTags) ?? [], [post?.images]);
  const isAuthor = Boolean(token && post && currentUserId === post.authorId);

  const like = async () => {
    if (!post) return;
    if (!token) {
      setMessage('로그인해야 좋아요를 누를 수 있습니다.');
      return;
    }
    try {
      const result = await toggleOotdPostLike(token, post.postId);
      setPost((prev) => prev ? { ...prev, likeCount: result.likeCount } : prev);
      setLiked(result.liked);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '좋아요 처리에 실패했습니다.');
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!post) return;
    if (!token) {
      setMessage('로그인해야 댓글을 작성할 수 있습니다.');
      return;
    }
    if (!comment.trim()) return;
    try {
      const created = await createOotdPostComment(token, post.postId, comment.trim(), replyTo?.commentId);
      setPost((prev) => prev ? { ...prev, comments: appendComment(prev.comments, created) } : prev);
      setComment('');
      setReplyTo(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '댓글 작성에 실패했습니다.');
    }
  };

  const removeCommentById = async (commentId: number) => {
    if (!token) {
      setMessage('로그인해야 댓글을 삭제할 수 있습니다.');
      return;
    }
    if (!window.confirm('댓글을 삭제할까요? 대댓글이 있으면 함께 삭제됩니다.')) return;
    try {
      await deleteOotdPostComment(token, commentId);
      setPost((prev) => prev ? { ...prev, comments: removeComment(prev.comments, commentId) } : prev);
      if (replyTo?.commentId === commentId) setReplyTo(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다.');
    }
  };

  const removePost = async () => {
    if (!post || !token || deleting) return;
    const confirmed = window.confirm('게시글을 삭제할까요? 삭제하면 게시판에 더 이상 보이지 않습니다.');
    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    try {
      await deleteOotdPost(token, post.postId);
      router.push('/ootd-board');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '게시글 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const moveImage = (nextIndex: number) => {
    if (!post) return;
    setActiveImageIndex(Math.min(post.images.length - 1, Math.max(0, nextIndex)));
    setShowBrandTags(false);
  };

  const renderComment = (item: OotdComment, depth = 0) => (
    <div key={item.commentId} className={depth > 0 ? 'ml-10 border-l border-surface-container pl-4' : ''}>
      <div className="flex gap-3">
        <Avatar imageUrl={item.authorProfileImageUrl} name={item.authorNickname} size="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm">
            <span className="font-bold">{item.authorNickname}</span> {item.content}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-stone-400">
            <span>{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
            {token && (
              <button type="button" className="font-bold text-primary" onClick={() => setReplyTo(item)}>
                답글 달기
              </button>
            )}
            {token && currentUserId === item.authorId && (
              <button type="button" className="font-bold text-error" onClick={() => removeCommentById(item.commentId)}>
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
      {item.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {item.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

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
                <button
                  type="button"
                  onClick={() => setShowBrandTags((value) => !value)}
                  className="relative block aspect-[4/5] w-full"
                  aria-label={showBrandTags ? '브랜드 태그 숨기기' : '브랜드 태그 보기'}
                >
                  <Image
                    className="object-cover"
                    src={activeImage.imageUrl}
                    alt="OOTD 상세 이미지"
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    priority
                  />
                </button>
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 text-on-surface-variant"><Shirt size={42} />이미지가 없습니다</div>
              )}

              {activeImage && activeImage.brandTags.length > 0 ? (
                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur">
                  {showBrandTags ? '사진을 누르면 태그 숨기기' : '사진을 누르면 브랜드 태그 보기'}
                </div>
              ) : null}

              {showBrandTags && activeImage?.brandTags.map((tag) => (
                <a
                  key={tag.brandTagId}
                  href={tag.shopUrl ?? '#'}
                  target={tag.shopUrl ? '_blank' : undefined}
                  rel={tag.shopUrl ? 'noreferrer' : undefined}
                  className="absolute -translate-x-1/2 -translate-y-full cursor-pointer active:scale-95"
                  style={{ left: `${tag.positionX}%`, top: `${tag.positionY}%` }}
                >
                  <div className="flex items-center gap-2 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-primary-fixed" />
                    {tag.brandName}
                    <ChevronRight size={14} />
                  </div>
                  <span className="mx-auto mt-1 block h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
                </a>
              ))}

              {post.images.length > 1 && (
                <>
                  <button type="button" onClick={() => moveImage(activeImageIndex - 1)} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur">
                    <ChevronLeft />
                  </button>
                  <button type="button" onClick={() => moveImage(activeImageIndex + 1)} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur">
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar imageUrl={post.authorProfileImageUrl} name={post.authorNickname} />
                <div>
                  <h1 className="font-headline text-base font-bold text-on-surface">{post.authorNickname}</h1>
                  <p className="text-sm text-stone-400">my_ootd member</p>
                </div>
              </div>
              {isAuthor ? (
                <div className="flex items-center gap-2">
                  <Link href={`/ootd-upload?edit=${post.postId}`} className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary">
                    <Pencil size={15} /> 수정
                  </Link>
                  <button type="button" onClick={removePost} disabled={deleting} className="inline-flex items-center gap-1 rounded-full bg-error-container px-4 py-2 text-sm font-semibold text-on-error-container disabled:opacity-60">
                    <Trash2 size={15} /> {deleting ? '삭제 중' : '삭제'}
                  </button>
                </div>
              ) : (
                <button className="rounded-full bg-surface-container-low px-6 py-2 text-sm font-semibold text-primary">Follow</button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-100 pb-6">
                <button type="button" onClick={like} className="flex items-center gap-2">
                  <Heart className={liked ? 'text-error' : 'text-stone-400'} fill={liked ? 'currentColor' : 'none'} />
                  <span className="font-bold">{post.likeCount}</span>
                </button>
                <div className="flex items-center gap-2"><MessageCircle className="text-stone-400" /><span className="font-bold">{countComments(post.comments)}</span></div>
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
                <a key={tag.brandTagId} href={tag.shopUrl ?? '#'} target={tag.shopUrl ? '_blank' : undefined} rel={tag.shopUrl ? 'noreferrer' : undefined} className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Brand</span>
                  <span className="font-medium text-on-surface">{tag.brandName}</span>
                </a>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-on-surface">댓글 ({countComments(post.comments)})</h2>
              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                {post.comments.length === 0 && <p className="text-sm text-stone-500">아직 댓글이 없습니다.</p>}
                {post.comments.map((item) => renderComment(item))}
              </div>
              <form onSubmit={submitComment} className="space-y-2 pt-2">
                {replyTo && (
                  <div className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
                    <span><b className="text-primary">@{replyTo.authorNickname}</b> 님에게 답글 작성 중</span>
                    <button type="button" className="font-bold text-primary" onClick={() => setReplyTo(null)}>취소</button>
                  </div>
                )}
                <div className="relative">
                <input value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-full border border-stone-200 bg-white px-6 py-3 pr-16 text-sm outline-none transition focus:border-primary-container" placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'} />
                <button type="submit" className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm font-bold text-primary"><Send size={14} />게시</button>
                </div>
              </form>
              {message && <p className="text-sm text-error">{message}</p>}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Plus, Send, X } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { ApiRequestError, createOotdPost } from '@/lib/api/client';
import type { LookCategory } from '@/lib/api/types';
import { clearAccessTokenFromStorage, getAccessTokenFromStorage } from '@/lib/auth/token';

const categories: LookCategory[] = ['STREET', 'CASUAL', 'MINIMAL', 'SPORTY', 'FORMAL', 'WORK', 'DATE', 'TRAVEL', 'ETC'];
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

type BrandTagDraft = {
  imageIndex: number;
  brandName: string;
  shopUrl: string;
  positionX: number;
  positionY: number;
};

export default function OotdUploadPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [lookCategory, setLookCategory] = useState<LookCategory>('STREET');
  const [tagInput, setTagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [brandTags, setBrandTags] = useState<BrandTagDraft[]>([]);
  const [brandName, setBrandName] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const compressImageIfNeeded = (file: File) => {
    if (file.size <= COMPRESS_THRESHOLD_BYTES || !file.type.startsWith('image/')) {
      return Promise.resolve(file);
    }

    return new Promise<File>((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          resolve(file);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const filename = file.name.replace(/\.[^.]+$/, '') || 'ootd-image';
            resolve(new File([blob], `${filename}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          0.86
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      image.src = objectUrl;
    });
  };

  const appendFiles = async (selectedFiles: File[]) => {
    const images = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) {
      setMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    const optimizedImages = await Promise.all(images.map(compressImageIfNeeded));
    const oversized = optimizedImages.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized.length > 0) {
      setMessage('이미지는 1장당 25MB 이하로 업로드해 주세요.');
      return;
    }
    setFiles((prev) => [...prev, ...optimizedImages].slice(0, 8));
    setMessage(null);
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const addHashtag = () => {
    const normalized = tagInput.replaceAll('#', '').trim();
    if (!normalized) return;
    setHashtags((prev) => Array.from(new Set([...prev, normalized])));
    setTagInput('');
  };

  const addBrandTag = () => {
    if (!brandName.trim()) return;
    setBrandTags((prev) => [
      ...prev,
      { imageIndex: 0, brandName: brandName.trim(), shopUrl: shopUrl.trim(), positionX: 42.5, positionY: 36.2 }
    ]);
    setBrandName('');
    setShopUrl('');
  };

  const submit = async () => {
    const currentToken = getAccessTokenFromStorage();
    if (!currentToken) {
      router.push('/login');
      return;
    }
    if (files.length === 0) {
      setMessage('이미지를 1장 이상 선택해 주세요.');
      return;
    }
    if (!caption.trim()) {
      setMessage('설명을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const created = await createOotdPost(currentToken, {
        images: files,
        caption,
        lookCategory,
        hashtags,
        brandTagsJson: brandTags.length > 0 ? JSON.stringify(brandTags) : undefined
      });
      router.push(`/ootd-posts/${created.postId}`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        clearAccessTokenFromStorage();
        setToken(null);
        setMessage('로그인이 만료되었거나 인증 정보가 유효하지 않습니다. 다시 로그인한 뒤 게시해 주세요.');
        return;
      }
      setMessage(error instanceof Error ? error.message : '게시글 업로드에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activePath="/ootd-upload" withFooter>
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-8 md:px-12 md:py-12">
        <header>
          <h1 className="font-headline text-4xl font-bold text-on-surface">새로운 OOTD 공유하기</h1>
          <p className="mt-2 text-lg text-secondary">당신의 오늘의 스타일을 기록하고 공유해보세요.</p>
          {!token ? <p className="mt-3 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant">게시하려면 로그인이 필요합니다.</p> : null}
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <section className="space-y-8 lg:col-span-3">
            <div className="space-y-4">
              <label className="block font-headline text-2xl font-semibold text-on-surface">사진 업로드</label>
              <label
                className={`relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-surface-container-low transition-colors ${isDragging ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:border-primary'}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(false);
                  appendFiles(Array.from(event.dataTransfer.files));
                }}
              >
                {previews[0] ? <img src={previews[0]} alt="업로드 미리보기" className="absolute inset-0 h-full w-full object-cover" /> : null}
                <input type="file" multiple accept="image/*" onChange={onFiles} className="hidden" />
                {!previews[0] ? (
                  <div className="relative z-10 flex flex-col items-center rounded-full bg-white/70 p-8 text-center backdrop-blur-md">
                    <CloudUpload className="mb-2 text-primary" size={42} />
                    <span className="text-sm font-semibold text-on-surface">이미지를 드래그하거나 클릭하여 업로드</span>
                  </div>
                ) : (
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-white/85 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur">
                    클릭 또는 드래그로 추가
                  </div>
                )}
                {isDragging ? <div className="absolute inset-4 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-white bg-primary/50 text-lg font-bold text-white backdrop-blur-sm">여기에 놓으면 업로드됩니다</div> : null}
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {previews.map((url, index) => (
                  <div key={url} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-primary">
                    <img src={url} alt={`미리보기 ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
                <label className="flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-surface-container transition hover:bg-surface-container-high">
                  <Plus className="text-stone-400" />
                  <input type="file" multiple accept="image/*" onChange={onFiles} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block font-headline text-2xl font-semibold text-on-surface">브랜드 태그 추가</label>
              <div className="rounded-2xl bg-white p-5 shadow-soft">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="rounded-xl border border-outline-variant px-4 py-3" placeholder="브랜드명" />
                  <input value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} className="rounded-xl border border-outline-variant px-4 py-3" placeholder="shopUrl" />
                </div>
                <button type="button" onClick={addBrandTag} className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white">태그 추가</button>
                <div className="mt-4 flex flex-wrap gap-2">
                  {brandTags.map((tag, index) => <span key={`${tag.brandName}-${index}`} className="rounded-lg bg-secondary-container px-3 py-1 text-xs text-on-secondary-container">{tag.brandName}</span>)}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-10 lg:col-span-2">
            <div className="space-y-4">
              <label className="block font-headline text-2xl font-semibold text-on-surface">설명</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[160px] w-full resize-none rounded-2xl border border-outline-variant bg-white p-5 outline-none transition focus:border-primary-container focus:ring-2 focus:ring-primary-container" placeholder="오늘의 룩에 대해 이야기해주세요..." />
            </div>

            <div className="space-y-4">
              <label className="block font-headline text-2xl font-semibold text-on-surface">스타일 카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button key={category} type="button" onClick={() => setLookCategory(category)} className={lookCategory === category ? 'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm' : 'rounded-full border border-outline-variant bg-white px-5 py-2.5 text-sm font-medium text-on-surface-variant'}>
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block font-headline text-2xl font-semibold text-on-surface">해시태그</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }} className="flex-1 rounded-xl border border-outline-variant bg-white px-4 py-4" placeholder="해시태그 입력" />
                <button type="button" onClick={addHashtag} className="rounded-xl bg-surface-container px-4 font-bold">추가</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <button key={tag} type="button" onClick={() => setHashtags((prev) => prev.filter((item) => item !== tag))} className="flex items-center gap-1 rounded-lg bg-secondary-container px-3 py-1 text-xs text-on-secondary-container">
                    #{tag} <X size={13} />
                  </button>
                ))}
              </div>
            </div>

            {message && <p className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{message}</p>}
            <button type="button" disabled={submitting} onClick={submit} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-bold text-on-primary shadow-[0_10px_30px_rgba(66,85,71,0.2)] transition active:scale-[0.98] disabled:opacity-60">
              <span>{submitting ? '게시 중...' : '게시하기'}</span>
              <Send size={20} />
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

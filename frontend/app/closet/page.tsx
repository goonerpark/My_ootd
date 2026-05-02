"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edit3, Heart, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/layout";
import { ClosetItemForm } from "@/components/ClosetItemForm";
import {
  ApiRequestError,
  createClosetItem,
  deleteClosetItem,
  fetchClosetItemDetail,
  fetchClosetItems,
  updateClosetItem
} from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import type { ClosetCategory, ClosetItem, UpsertClosetItemPayload } from "@/lib/api/types";
import {
  CLOSET_CATEGORY_OPTIONS,
  getClosetCategoryLabel,
  getClosetFitLabel,
  getClosetSeasonLabel,
  getClosetThicknessLabel
} from "@/lib/closet/options";
import { EmptyState, ErrorMessage, LoadingState, PrimaryButton, SecondaryButton } from "@/components/ui";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") return "로그인이 필요한 기능입니다.";
  if (message === "Unexpected server error") return "서버에서 예기치 못한 오류가 발생했습니다.";
  return message;
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

function ClosetCard({
  item,
  selected,
  onEdit,
  onDelete
}: {
  item: ClosetItem;
  selected: boolean;
  onEdit: (item: ClosetItem) => void;
  onDelete: (item: ClosetItem) => void;
}) {
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return (
    <article
      className={[
        "group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        selected ? "border-primary" : "border-transparent hover:border-slate-100"
      ].join(" ")}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low">
        {imageUrl ? (
          <img
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={imageUrl}
            alt={`${getClosetCategoryLabel(item.category)} 이미지`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-caption-xs font-bold text-secondary">
            이미지 없음
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:text-primary"
            type="button"
            onClick={() => onEdit(item)}
            aria-label="수정"
          >
            <Edit3 size={16} />
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-error shadow-sm backdrop-blur-sm transition hover:bg-error hover:text-white"
            type="button"
            onClick={() => onDelete(item)}
            aria-label="삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-caption-xs font-bold text-secondary">
              {item.category}
            </span>
            <h3 className="mt-1 font-title-sm text-title-sm">{item.subcategory || getClosetCategoryLabel(item.category)}</h3>
          </div>
          <Heart className="mt-1 text-slate-300" size={18} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-caption-xs font-medium text-secondary">
            <span className="h-3 w-3 rounded-full border border-slate-200 bg-slate-200" />
            <span>
              {item.color || "색상 없음"} / {getClosetFitLabel(item.fit)}
            </span>
          </div>
          <p className="truncate text-caption-xs font-medium text-on-primary-container">
            {item.brand ? `Brand: ${item.brand}` : item.memo || "메모 없음"}
          </p>
          <p className="text-caption-xs text-on-surface-variant">
            {getClosetSeasonLabel(item.season)} / {getClosetThicknessLabel(item.thickness)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ClosetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ClosetCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  const loadItems = async (authToken: string) => {
    setLoadingList(true);
    try {
      const data = await fetchClosetItems(authToken);
      setItems(data);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const initialize = async () => {
      setError(null);
      try {
        await loadItems(token);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "옷장 목록 조회에 실패했습니다.";
        setError(message);
      }
    };
    initialize();
  }, [token]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const categoryMatched = selectedCategory === "ALL" || item.category === selectedCategory;
      const keywordMatched =
        keyword.length === 0 ||
        [item.category, item.subcategory, item.color, item.brand, item.memo]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return categoryMatched && keywordMatched;
    });
  }, [items, search, selectedCategory]);

  const handleCreate = async (payload: UpsertClosetItemPayload) => {
    if (!token) return setError("로그인이 필요한 기능입니다.");
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createClosetItem(token, payload);
      await loadItems(token);
      setShowCreateForm(false);
      setSuccess("옷이 등록되었습니다.");
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "옷 등록에 실패했습니다.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSelect = async (item: ClosetItem) => {
    if (!token) return setError("로그인이 필요한 기능입니다.");
    setError(null);
    try {
      setEditingItem(await fetchClosetItemDetail(token, item.id));
      setShowCreateForm(false);
      setSuccess(null);
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "상세 조회에 실패했습니다.";
      setError(message);
    }
  };

  const handleUpdate = async (payload: UpsertClosetItemPayload) => {
    if (!token || !editingItem) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateClosetItem(token, editingItem.id, payload);
      await loadItems(token);
      setEditingItem(null);
      setSuccess("옷 정보가 수정되었습니다.");
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "옷 수정에 실패했습니다.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ClosetItem) => {
    if (!token) return setError("로그인이 필요한 기능입니다.");
    if (!window.confirm("이 아이템을 삭제하시겠어요?")) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteClosetItem(token, item.id);
      if (editingItem?.id === item.id) setEditingItem(null);
      await loadItems(token);
      setSuccess("옷 아이템이 삭제되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "옷 삭제에 실패했습니다.";
      setError(message);
    }
  };

  if (!token) {
    return (
      <AppShell activePath="/closet">
        <section className="rounded-3xl border border-surface-container bg-white p-8 shadow-soft">
          <h1 className="font-headline-md text-headline-md">나의 옷장</h1>
          <p className="mt-2 text-on-surface-variant">로그인 후 옷 등록/수정/삭제 기능을 사용할 수 있어요.</p>
          <div className="mt-5 flex gap-2">
            <Link className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" href="/login">
              로그인
            </Link>
            <Link className="rounded-full border border-outline-variant bg-white px-5 py-2 text-sm font-bold text-primary" href="/signup">
              회원가입
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/closet">
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary">나의 옷장</h1>
            <p className="mt-2 font-body-md text-body-md text-secondary">총 {items.length}개의 아이템이 등록되어 있습니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="group relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" />
              <input
                className="w-full rounded-full border-none bg-white py-2 pl-10 pr-4 font-body-md text-body-md shadow-sm focus:ring-2 focus:ring-primary/10 md:w-64"
                placeholder="아이템 검색..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button className="rounded-full bg-white p-2 text-secondary shadow-sm transition-colors hover:text-primary" type="button" aria-label="필터">
              <SlidersHorizontal size={22} />
            </button>
          </div>
        </section>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            className={[
              "whitespace-nowrap rounded-full px-6 py-2.5 font-label-sm text-label-sm shadow-sm transition-all",
              selectedCategory === "ALL" ? "bg-primary text-on-primary shadow-md" : "bg-white text-secondary hover:shadow-md"
            ].join(" ")}
            type="button"
            onClick={() => setSelectedCategory("ALL")}
          >
            ALL
          </button>
          {CLOSET_CATEGORY_OPTIONS.map((category) => (
            <button
              key={category.value}
              className={[
                "whitespace-nowrap rounded-full px-6 py-2.5 font-label-sm text-label-sm shadow-sm transition-all",
                selectedCategory === category.value ? "bg-primary text-on-primary shadow-md" : "bg-white text-secondary hover:shadow-md"
              ].join(" ")}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.value}
            </button>
          ))}
        </div>

        {success && <p className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{success}</p>}
        {error && <ErrorMessage message={error} />}

        {loadingList ? (
          <LoadingState label="목록을 불러오는 중입니다..." />
        ) : filteredItems.length === 0 ? (
          <EmptyState description={items.length === 0 ? "등록한 옷이 없습니다." : "검색 조건에 맞는 옷이 없습니다."} />
        ) : (
          <section className="grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ClosetCard
                key={item.id}
                item={item}
                selected={editingItem?.id === item.id}
                onEdit={handleEditSelect}
                onDelete={handleDelete}
              />
            ))}
          </section>
        )}
      </div>

      {!showCreateForm && !editingItem && (
        <button
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-transform duration-200 active:scale-95 md:bottom-8"
          type="button"
          onClick={() => setShowCreateForm(true)}
          aria-label="옷장 아이템 등록"
        >
          <Plus size={28} />
        </button>
      )}

      {(showCreateForm || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl hide-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-primary">{editingItem ? "옷장 아이템 수정" : "옷장 아이템 등록"}</h2>
              <button
                className="rounded-full p-2 text-secondary transition hover:bg-surface-container-low hover:text-primary"
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingItem(null);
                }}
                aria-label="닫기"
              >
                <X size={22} />
              </button>
            </div>
            {showCreateForm && (
              <ClosetItemForm mode="create" loading={submitting} onSubmit={handleCreate} onCancelEdit={() => setShowCreateForm(false)} />
            )}
            {editingItem && (
              <ClosetItemForm mode="edit" loading={submitting} initialItem={editingItem} onSubmit={handleUpdate} onCancelEdit={() => setEditingItem(null)} />
            )}
            <div className="mt-4">
              <SecondaryButton
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingItem(null);
                }}
              >
                닫기
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

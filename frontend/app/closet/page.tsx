"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Heart, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import useSWR from "swr";
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
import { EmptyState, ErrorMessage, SecondaryButton } from "@/components/ui";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") return "濡쒓렇?몄씠 ?꾩슂??湲곕뒫?낅땲??";
  if (message === "Unexpected server error") return "?쒕쾭?먯꽌 ?덇린移?紐삵븳 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.";
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

const ClosetCard = memo(function ClosetCard({
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
            alt={`${getClosetCategoryLabel(item.category)} ?대?吏`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-caption-xs font-bold text-secondary">
            ?대?吏 ?놁쓬
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:text-primary"
            type="button"
            onClick={() => onEdit(item)}
            aria-label="?섏젙"
          >
            <Edit3 size={16} />
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-error shadow-sm backdrop-blur-sm transition hover:bg-error hover:text-white"
            type="button"
            onClick={() => onDelete(item)}
            aria-label="??젣"
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
              {item.color || "?됱긽 ?놁쓬"} / {getClosetFitLabel(item.fit)}
            </span>
          </div>
          <p className="truncate text-caption-xs font-medium text-on-primary-container">
            {item.brand ? `Brand: ${item.brand}` : item.memo || "硫붾え ?놁쓬"}
          </p>
          <p className="text-caption-xs text-on-surface-variant">
            {getClosetSeasonLabel(item.season)} / {getClosetThicknessLabel(item.thickness)}
          </p>
        </div>
      </div>
    </article>
  );
});

function ClosetGridSkeleton() {
  return (
    <section className="grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading closet items">
      {Array.from({ length: 8 }).map((_, index) => (
        <article key={index} className="overflow-hidden rounded-3xl border border-transparent bg-white shadow-sm">
          <div className="aspect-[3/4] animate-pulse bg-surface-container-low" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-16 animate-pulse rounded-full bg-surface-container" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-surface-container" />
            <div className="h-3 w-full animate-pulse rounded bg-surface-container" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface-container" />
          </div>
        </article>
      ))}
    </section>
  );
}

export default function ClosetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ClosetCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  const {
    data: items = [],
    error: itemsError,
    isLoading: loadingList,
    mutate: refreshItems
  } = useSWR<ClosetItem[]>(
    token ? ["closet-items", token] : null,
    ([, authToken]) => fetchClosetItems(authToken as string),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 10_000
    }
  );

  useEffect(() => {
    if (!itemsError) return;
    const message = itemsError instanceof Error ? toKoreanErrorMessage(itemsError.message) : "옷장 목록 조회에 실패했습니다.";
    setError(message);
  }, [itemsError]);
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
    if (!token) return setError("濡쒓렇?몄씠 ?꾩슂??湲곕뒫?낅땲??");
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createClosetItem(token, payload);
      await refreshItems();
      setShowCreateForm(false);
      setSuccess("?룹씠 ?깅줉?섏뿀?듬땲??");
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "???깅줉???ㅽ뙣?덉뒿?덈떎.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSelect = async (item: ClosetItem) => {
    if (!token) return setError("濡쒓렇?몄씠 ?꾩슂??湲곕뒫?낅땲??");
    setError(null);
    try {
      setEditingItem(await fetchClosetItemDetail(token, item.id));
      setShowCreateForm(false);
      setSuccess(null);
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "?곸꽭 議고쉶???ㅽ뙣?덉뒿?덈떎.";
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
      await refreshItems();
      setEditingItem(null);
      setSuccess("???뺣낫媛 ?섏젙?섏뿀?듬땲??");
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "???섏젙???ㅽ뙣?덉뒿?덈떎.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ClosetItem) => {
    if (!token) return setError("濡쒓렇?몄씠 ?꾩슂??湲곕뒫?낅땲??");
    if (!window.confirm("???꾩씠?쒖쓣 ??젣?섏떆寃좎뼱??")) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteClosetItem(token, item.id);
      if (editingItem?.id === item.id) setEditingItem(null);
      await refreshItems();
      setSuccess("???꾩씠?쒖씠 ??젣?섏뿀?듬땲??");
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "????젣???ㅽ뙣?덉뒿?덈떎.";
      setError(message);
    }
  };

  if (!token) {
    return (
      <AppShell activePath="/closet">
        <section className="rounded-3xl border border-surface-container bg-white p-8 shadow-soft">
          <h1 className="font-headline-md text-headline-md">?섏쓽 ?룹옣</h1>
          <p className="mt-2 text-on-surface-variant">濡쒓렇???????깅줉/?섏젙/??젣 湲곕뒫???ъ슜?????덉뼱??</p>
          <div className="mt-5 flex gap-2">
            <Link className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" href="/login">
              濡쒓렇??            </Link>
            <Link className="rounded-full border border-outline-variant bg-white px-5 py-2 text-sm font-bold text-primary" href="/signup">
              ?뚯썝媛??            </Link>
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
            <h1 className="font-display-lg text-display-lg text-primary">?섏쓽 ?룹옣</h1>
            <p className="mt-2 font-body-md text-body-md text-secondary">珥?{items.length}媛쒖쓽 ?꾩씠?쒖씠 ?깅줉?섏뼱 ?덉뒿?덈떎.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="group relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" />
              <input
                className="w-full rounded-full border-none bg-white py-2 pl-10 pr-4 font-body-md text-body-md shadow-sm focus:ring-2 focus:ring-primary/10 md:w-64"
                placeholder="?꾩씠??寃??.."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button className="rounded-full bg-white p-2 text-secondary shadow-sm transition-colors hover:text-primary" type="button" aria-label="?꾪꽣">
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
          <ClosetGridSkeleton />
        ) : filteredItems.length === 0 ? (
          <EmptyState description={items.length === 0 ? "?깅줉???룹씠 ?놁뒿?덈떎." : "寃??議곌굔??留욌뒗 ?룹씠 ?놁뒿?덈떎."} />
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
          aria-label="?룹옣 ?꾩씠???깅줉"
        >
          <Plus size={28} />
        </button>
      )}

      {(showCreateForm || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl hide-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-primary">{editingItem ? "?룹옣 ?꾩씠???섏젙" : "?룹옣 ?꾩씠???깅줉"}</h2>
              <button
                className="rounded-full p-2 text-secondary transition hover:bg-surface-container-low hover:text-primary"
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingItem(null);
                }}
                aria-label="?リ린"
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
                ?リ린
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}




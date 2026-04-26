"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClosetItemCard } from "@/components/ClosetItemCard";
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
import type { ClosetItem, UpsertClosetItemPayload } from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

export default function ClosetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    if (!token) {
      return;
    }
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

  const handleCreate = async (payload: UpsertClosetItemPayload) => {
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createClosetItem(token, payload);
      await loadItems(token);
      setSuccess("옷이 등록되었습니다.");
    } catch (err) {
      const message =
        err instanceof ApiRequestError || err instanceof Error
          ? toKoreanErrorMessage(err.message)
          : "옷 등록에 실패했습니다.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSelect = async (item: ClosetItem) => {
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      return;
    }
    setError(null);
    try {
      const detail = await fetchClosetItemDetail(token, item.id);
      setEditingItem(detail);
      setSuccess(null);
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "상세 조회에 실패했습니다.";
      setError(message);
    }
  };

  const handleUpdate = async (payload: UpsertClosetItemPayload) => {
    if (!token || !editingItem) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateClosetItem(token, editingItem.id, payload);
      await loadItems(token);
      setEditingItem(null);
      setSuccess("옷 정보가 수정되었습니다.");
    } catch (err) {
      const message =
        err instanceof ApiRequestError || err instanceof Error
          ? toKoreanErrorMessage(err.message)
          : "옷 수정에 실패했습니다.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ClosetItem) => {
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      return;
    }
    const confirmed = window.confirm("이 옷 아이템을 삭제하시겠어요?");
    if (!confirmed) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await deleteClosetItem(token, item.id);
      if (editingItem?.id === item.id) {
        setEditingItem(null);
      }
      await loadItems(token);
      setSuccess("옷 아이템이 삭제되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "옷 삭제에 실패했습니다.";
      setError(message);
    }
  };

  if (!token) {
    return (
      <main className="page">
        <section className="container">
          <header className="header">
            <h1>나의 옷장</h1>
            <p>회원 전용 기능</p>
          </header>
          <section className="panel">
            <p className="muted">로그인 후 옷 등록/수정/삭제 기능을 사용할 수 있어요.</p>
            <div className="inlineActions">
              <Link className="primaryBtn" href="/login">
                로그인
              </Link>
              <Link className="ghostBtn" href="/signup">
                회원가입
              </Link>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <h1>나의 옷장</h1>
          <p>등록한 옷을 관리하고 OOTD 추천에 활용할 수 있도록 정리하세요.</p>
        </header>

        <p className="muted">
          <Link className="textLink" href="/">
            메인으로 이동
          </Link>
        </p>

        <ClosetItemForm mode="create" loading={submitting} onSubmit={handleCreate} />

        {editingItem && (
          <ClosetItemForm
            mode="edit"
            loading={submitting}
            initialItem={editingItem}
            onSubmit={handleUpdate}
            onCancelEdit={() => setEditingItem(null)}
          />
        )}

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        <section className="panel">
          <h2>내 옷 목록</h2>
          {loadingList ? (
            <p className="muted">목록을 불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="muted">등록된 옷이 없습니다.</p>
          ) : (
            <div className="closetGrid">
              {items.map((item) => (
                <ClosetItemCard
                  key={item.id}
                  item={item}
                  selected={editingItem?.id === item.id}
                  onSelect={handleEditSelect}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

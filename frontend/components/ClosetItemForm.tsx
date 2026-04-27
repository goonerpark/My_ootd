"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ClosetCategory,
  ClosetFit,
  ClosetItem,
  ClosetSeason,
  ClosetThickness,
  UpsertClosetItemPayload
} from "@/lib/api/types";
import {
  CLOSET_CATEGORY_OPTIONS,
  CLOSET_FIT_OPTIONS,
  CLOSET_SEASON_OPTIONS,
  CLOSET_THICKNESS_OPTIONS
} from "@/lib/closet/options";

const DEFAULT_FORM: UpsertClosetItemPayload = {
  category: "TOP",
  color: "",
  season: "ALL",
  thickness: "NORMAL",
  fit: "UNKNOWN",
  brand: "",
  memo: "",
  imageUrl: "",
  imageFile: null
};

type ClosetItemFormProps = {
  mode: "create" | "edit";
  loading: boolean;
  initialItem?: ClosetItem | null;
  onSubmit: (payload: UpsertClosetItemPayload) => Promise<void>;
  onCancelEdit?: () => void;
};

function toPreviewUrl(file: File | null, imageUrl?: string) {
  if (file) {
    return URL.createObjectURL(file);
  }
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl.trim();
  }
  return null;
}

export function ClosetItemForm({ mode, loading, initialItem, onSubmit, onCancelEdit }: ClosetItemFormProps) {
  const [category, setCategory] = useState<ClosetCategory>("TOP");
  const [subcategory, setSubcategory] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState<ClosetSeason>("ALL");
  const [thickness, setThickness] = useState<ClosetThickness>("NORMAL");
  const [fit, setFit] = useState<ClosetFit>("UNKNOWN");
  const [brand, setBrand] = useState("");
  const [memo, setMemo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (mode === "edit" && initialItem) {
      setCategory(initialItem.category);
      setSubcategory(initialItem.subcategory ?? "");
      setColor(initialItem.color ?? "");
      setSeason(initialItem.season);
      setThickness(initialItem.thickness);
      setFit(initialItem.fit);
      setBrand(initialItem.brand ?? "");
      setMemo(initialItem.memo ?? "");
      setImageUrl(initialItem.imageUrl ?? "");
      setImageFile(null);
      return;
    }
    setCategory(DEFAULT_FORM.category);
    setSubcategory("");
    setColor("");
    setSeason(DEFAULT_FORM.season as ClosetSeason);
    setThickness(DEFAULT_FORM.thickness as ClosetThickness);
    setFit(DEFAULT_FORM.fit as ClosetFit);
    setBrand("");
    setMemo("");
    setImageUrl("");
    setImageFile(null);
  }, [mode, initialItem]);

  const previewUrl = useMemo(() => toPreviewUrl(imageFile, imageUrl), [imageFile, imageUrl]);

  useEffect(() => {
    if (!previewUrl || !previewUrl.startsWith("blob:")) {
      return;
    }
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const submitForm = async () => {
    const payload: UpsertClosetItemPayload = {
      category,
      subcategory,
      color,
      season,
      thickness,
      fit,
      brand,
      memo,
      imageUrl,
      imageFile
    };
    await onSubmit(payload);
    if (mode === "create") {
      setImageFile(null);
    }
  };

  return (
    <section className="sectionCard">
      <h2>{mode === "edit" ? "옷 정보 수정" : "옷 등록"}</h2>
      <div className="form">
        <label className="field">
          <span>카테고리</span>
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value as ClosetCategory)}>
            {CLOSET_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>색상</span>
          <input className="input" value={color} onChange={(event) => setColor(event.target.value)} maxLength={50} />
        </label>

        <label className="field">
          <span>서브 카테고리</span>
          <input className="input" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} maxLength={50} />
        </label>

        <div className="closetFormRow">
          <label className="field">
            <span>시즌</span>
            <select className="input" value={season} onChange={(event) => setSeason(event.target.value as ClosetSeason)}>
              {CLOSET_SEASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>두께감</span>
            <select
              className="input"
              value={thickness}
              onChange={(event) => setThickness(event.target.value as ClosetThickness)}
            >
              {CLOSET_THICKNESS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>핏</span>
            <select className="input" value={fit} onChange={(event) => setFit(event.target.value as ClosetFit)}>
              {CLOSET_FIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>브랜드</span>
          <input className="input" value={brand} onChange={(event) => setBrand(event.target.value)} maxLength={100} />
        </label>

        <label className="field">
          <span>메모</span>
          <textarea
            className="input textarea"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            maxLength={255}
            placeholder="예: 출근, 비 오는 날에 자주 입는 옷"
          />
        </label>

        <label className="field">
          <span>이미지 파일 업로드</span>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="field">
          <span>또는 이미지 URL 입력</span>
          <input
            className="input"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            maxLength={500}
          />
        </label>

        {previewUrl && <img className="closetFormPreview" src={previewUrl} alt="옷 이미지 미리보기" />}

        <div className="inlineActions">
          <button className="primaryBtn" type="button" onClick={submitForm} disabled={loading}>
            {loading ? "저장 중..." : mode === "edit" ? "수정 저장" : "옷 등록"}
          </button>
          {mode === "edit" && onCancelEdit && (
            <button className="ghostBtn" type="button" onClick={onCancelEdit} disabled={loading}>
              취소
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

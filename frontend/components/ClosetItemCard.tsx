"use client";

import type { ClosetItem } from "@/lib/api/types";
import {
  getClosetCategoryLabel,
  getClosetFitLabel,
  getClosetSeasonLabel,
  getClosetThicknessLabel
} from "@/lib/closet/options";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function normalizeImageUrl(url: string) {
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

type ClosetItemCardProps = {
  item: ClosetItem;
  selected: boolean;
  onSelect: (item: ClosetItem) => void;
  onDelete: (item: ClosetItem) => void;
};

export function ClosetItemCard({ item, selected, onSelect, onDelete }: ClosetItemCardProps) {
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return (
    <article className={`closetCard${selected ? " active" : ""}`}>
      <img className="closetCardImage" src={imageUrl} alt={`${getClosetCategoryLabel(item.category)} 이미지`} />
      <div className="closetCardBody">
        <div className="closetTagRow">
          <span className="closetTag">{getClosetCategoryLabel(item.category)}</span>
          {item.color && <span className="closetTag">{item.color}</span>}
          <span className="closetTag">{getClosetFitLabel(item.fit)}</span>
        </div>
        <p className="muted">
          {getClosetSeasonLabel(item.season)} / {getClosetThicknessLabel(item.thickness)}
        </p>
        {item.brand && <p className="muted">브랜드: {item.brand}</p>}
        {item.memo && <p className="closetCardMemo">{item.memo}</p>}
        <div className="inlineActions">
          <button className="ghostBtn" type="button" onClick={() => onSelect(item)}>
            수정
          </button>
          <button className="ghostBtn" type="button" onClick={() => onDelete(item)}>
            삭제
          </button>
        </div>
      </div>
    </article>
  );
}

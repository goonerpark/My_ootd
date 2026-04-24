"use client";

import { useEffect, useMemo } from "react";

type OotdUploadFormProps = {
  reviewDate: string;
  notes: string;
  files: File[];
  loading: boolean;
  onChangeDate: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangeFiles: (files: File[]) => void;
  onSubmit: () => void;
};

export function OotdUploadForm({
  reviewDate,
  notes,
  files,
  loading,
  onChangeDate,
  onChangeNotes,
  onChangeFiles,
  onSubmit
}: OotdUploadFormProps) {
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <section className="panel">
      <h2>OOTD 업로드</h2>
      <div className="form">
        <label className="field">
          <span>리뷰 날짜</span>
          <input className="input" type="date" value={reviewDate} onChange={(event) => onChangeDate(event.target.value)} />
        </label>
        <label className="field">
          <span>메모 (선택)</span>
          <textarea
            className="input textarea"
            value={notes}
            onChange={(event) => onChangeNotes(event.target.value)}
            maxLength={255}
            placeholder="예: 출근 코디, 캐주얼 무드"
          />
        </label>
        <label className="field">
          <span>이미지 파일</span>
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onChangeFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        {previewUrls.length > 0 && (
          <div className="ootdPreviewGrid">
            {previewUrls.map((url, index) => (
              <img key={`${url}-${index}`} className="ootdPreviewImage" src={url} alt={`선택 이미지 ${index + 1}`} />
            ))}
          </div>
        )}

        <button className="primaryBtn" type="button" onClick={onSubmit} disabled={loading || files.length === 0}>
          {loading ? "업로드 중..." : "업로드하고 평가 받기"}
        </button>
      </div>
    </section>
  );
}

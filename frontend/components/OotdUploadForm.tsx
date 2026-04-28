"use client";

import { useEffect, useMemo } from "react";
import { CloudUpload, Upload } from "lucide-react";

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
  const mainPreview = previewUrls[0];

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
        <label className="relative flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low text-secondary">
          {mainPreview ? (
            <img className="absolute inset-0 h-full w-full object-cover" src={mainPreview} alt="선택한 OOTD 이미지" />
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-slate-400">
                <CloudUpload size={34} />
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-primary">이미지 업로드</p>
                <p className="mt-1 text-caption-xs font-medium text-secondary">JPG, PNG 파일을 선택해 주세요.</p>
              </div>
            </div>
          )}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onChangeFiles(Array.from(event.target.files ?? []))}
          />
          {mainPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-white/90 px-6 py-3 font-bold text-primary">
                <Upload size={18} />
                사진 변경하기
              </span>
            </div>
          )}
        </label>

        {previewUrls.length > 1 && (
          <div className="grid w-full grid-cols-4 gap-3">
            {previewUrls.slice(1).map((url, index) => (
              <img key={`${url}-${index}`} className="aspect-square rounded-xl object-cover" src={url} alt={`추가 선택 이미지 ${index + 2}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center space-y-6">
        <div>
          <h2 className="font-display-lg text-primary">오늘의 스타일 리포트</h2>
          <p className="text-body-lg text-secondary">AI가 분석할 OOTD 사진과 메모를 입력해 주세요.</p>
        </div>

        <div className="rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block font-label-sm text-label-sm text-primary">리뷰 날짜</span>
              <input
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/10"
                type="date"
                value={reviewDate}
                onChange={(event) => onChangeDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-label-sm text-label-sm text-primary">메모</span>
              <textarea
                className="min-h-28 w-full resize-none rounded-2xl border-none bg-surface-container-low px-4 py-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/10"
                value={notes}
                onChange={(event) => onChangeNotes(event.target.value)}
                maxLength={255}
                placeholder="예: 친구 약속, 출근 코디, 캐주얼 무드"
              />
            </label>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={onSubmit}
              disabled={loading || files.length === 0}
            >
              <Upload size={18} />
              {loading ? "업로드 중..." : "업로드하고 평가 받기"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

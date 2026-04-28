import Link from "next/link";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

export function AppLogo({ className, size = "md" }: Props) {
  return (
    <Link href="/" className={`appLogoLink appLogo-${size}${className ? ` ${className}` : ""}`} aria-label="메인으로 이동">
      <svg className="appLogoSvg" viewBox="0 0 520 140" role="img" aria-label="my_ootd">
        <path d="M260 38c0-10 8-18 18-18s18 8 18 18c0 8-5 15-12 18-4 2-6 4-6 8v7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M196 80l82-32 82 32" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <text x="48" y="116" fontSize="64" fontFamily="Georgia, 'Times New Roman', serif" fill="currentColor">my_ootd</text>
      </svg>
    </Link>
  );
}

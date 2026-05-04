import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

export function AppLogo({ className, size = "md" }: Props) {
  return (
    <Link href="/" className={`appLogoLink appLogo-${size}${className ? ` ${className}` : ""}`} aria-label="메인으로 이동">
      <Image className="appLogoImage" src="/my-ootd-logo.svg" alt="my_ootd" width={520} height={140} priority />
    </Link>
  );
}

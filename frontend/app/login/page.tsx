"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api/client";
import { setAccessTokenToStorage, setAuthUserProfileToStorage } from "@/lib/auth/token";
import { ErrorMessage, PageHeader, SectionCard } from "@/components/ui";

function toKoreanErrorMessage(message: string) {
  if (message === "Invalid email or password") return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (message === "Unexpected server error") return "서버에서 예기치 못한 오류가 발생했습니다.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      setAccessTokenToStorage(result.accessToken);
      setAuthUserProfileToStorage({
        userId: result.userId,
        email: result.email,
        nickname: result.nickname,
        gender: result.gender
      });
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="container">
        <PageHeader title="로그인" subtitle="회원 전용 추천 기능을 사용하려면 로그인해 주세요." />

        <form className="sectionCard form" onSubmit={onSubmit}>
          <label className="field">
            <span>이메일</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="primaryBtn" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {error && <ErrorMessage message={error} />}

        <SectionCard>
          <p className="muted">
            계정이 없나요? <Link className="textLink" href="/signup">회원가입</Link>
          </p>
          <p className="muted">
            <Link className="textLink" href="/">메인으로 이동</Link>
          </p>
        </SectionCard>
      </section>
    </main>
  );
}
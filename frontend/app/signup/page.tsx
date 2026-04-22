"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/api/client";
import type { Gender } from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Email is already in use") {
    return "이미 사용 중인 이메일입니다.";
  }
  if (message === "Nickname is already in use") {
    return "이미 사용 중인 닉네임입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 않은 오류가 발생했습니다.";
  }
  return message;
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signUp({ email, password, nickname, gender });
      setSuccess("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "회원가입에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <h1>회원가입</h1>
          <p>설문 기반 추천 사용을 위한 기본 계정을 생성합니다.</p>
        </header>

        <form className="panel form" onSubmit={onSubmit}>
          <label className="field">
            <span>이메일</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
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
          <label className="field">
            <span>닉네임</span>
            <input
              className="input"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              minLength={2}
              maxLength={50}
              required
            />
          </label>
          <label className="field">
            <span>성별</span>
            <select className="input" value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </label>
          <button className="primaryBtn" type="submit" disabled={loading}>
            {loading ? "회원가입 중..." : "회원가입"}
          </button>
        </form>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        <section className="panel">
          <p className="muted">
            이미 계정이 있나요? <Link className="textLink" href="/login">로그인</Link>
          </p>
          <p className="muted">
            <Link className="textLink" href="/">메인으로 이동</Link>
          </p>
        </section>
      </section>
    </main>
  );
}

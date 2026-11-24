"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/app/components/brand/BrandLogo";
import { apiRequest, ApiError } from "@/app/lib/api";

type LoginResponse = {
  user: { role: string };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!["ADMIN", "MANAGER", "CONTENT_MANAGER"].includes(result.user.role)) {
        await apiRequest("/auth/logout", { method: "POST" });
        setError("This account does not have administration access.");
        return;
      }
      router.replace("/admin");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not sign you in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <button type="button" className="admin-login-logo" onClick={() => router.push("/")}>
          <BrandLogo className="brand-logo-image" />
        </button>
        <span className="eyebrow">Store administration</span>
        <h1>Welcome back.</h1>
        <p>Sign in with your Umber Collection team account.</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label>
            Work email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <div className="admin-form-error" role="alert">{error}</div>}
          <button type="submit" className="button button-dark" disabled={busy}>
            {busy ? "Signing you in..." : "Sign in securely"}
          </button>
        </form>
        <button type="button" className="admin-back-link" onClick={() => router.push("/")}>
          ← Back to the collection
        </button>
      </div>
    </main>
  );
}

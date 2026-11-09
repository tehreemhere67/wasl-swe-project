"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, TextInput } from "@/components/ui";

export interface ForgotLabels {
  mobile: string;
  sendCode: string;
  resend: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  reset: string;
  resetting: string;
  success: string;
  errorOtpWrong: string;
  errorCooldown: string;
  errorGeneric: string;
  validation: Record<string, string>;
  devCodeNote: string;
}

/** Forgot password: request a code, then set a new password. */
export function ForgotPasswordForm({ labels }: { labels: ForgotLabels }) {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    setTopError(null);
    setErrors({});
    if (!mobile.trim()) {
      setErrors({ mobile: labels.validation.required ?? labels.errorGeneric });
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        devCode?: string;
        resendAfterSeconds?: number;
        error?: { code?: string; seconds?: number };
      };
      if (data.ok) {
        setSent(true);
        setCooldown(data.resendAfterSeconds ?? 60);
        setDevCode(data.devCode ?? null);
        return;
      }
      if (data.error?.code === "cooldown") {
        setCooldown(data.error.seconds ?? 60);
        setTopError(labels.errorCooldown.replace("{seconds}", String(data.error.seconds ?? 60)));
      } else if (data.error?.code === "not_found") {
        setTopError(labels.errorOtpWrong);
      } else {
        setTopError(labels.errorGeneric);
      }
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTopError(null);
    setErrors({});

    const local: Record<string, string> = {};
    if (!code.trim()) local.code = labels.validation.required ?? labels.errorGeneric;
    if (!password) local.password = labels.validation.required ?? labels.errorGeneric;
    else if (password.length < 8) local.password = labels.validation.tooShort ?? labels.errorGeneric;
    if (password !== confirmPassword) local.confirmPassword = labels.validation.mismatch ?? labels.errorGeneric;
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, code, password, confirmPassword }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: { code?: string; reason?: string } };
      if (data.ok) {
        setDone(true);
        setTimeout(() => {
          router.push("/?reset=1");
          router.refresh();
        }, 1200);
        return;
      }
      setTopError(labels.errorOtpWrong);
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={resetPassword} className="space-y-4" noValidate>
      {done ? (
        <Alert tone="success" role="status">
          {labels.success}
        </Alert>
      ) : null}
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      <Field label={labels.mobile} htmlFor="forgot-mobile" required error={errors.mobile}>
        <div className="flex gap-2">
          <TextInput
            id="forgot-mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0300 1234567"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            invalid={Boolean(errors.mobile)}
            required
          />
          <Button
            type="button"
            variant="secondary"
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="shrink-0"
          >
            {cooldown > 0 ? labels.resend.replace("{seconds}", String(cooldown)) : labels.sendCode}
          </Button>
        </div>
      </Field>

      {devCode ? (
        <Alert tone="info">
          <span className="font-semibold">{labels.devCodeNote}</span>
          <span className="ms-2 font-mono text-base tracking-widest">{devCode}</span>
        </Alert>
      ) : null}

      <Field label={labels.code} htmlFor="forgot-code" required error={errors.code}>
        <TextInput
          id="forgot-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\\d{6}"
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          invalid={Boolean(errors.code)}
          required
        />
      </Field>

      <Field label={labels.newPassword} htmlFor="forgot-password" required error={errors.password}>
        <TextInput
          id="forgot-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <Field label={labels.confirmPassword} htmlFor="forgot-confirm" required error={errors.confirmPassword}>
        <TextInput
          id="forgot-confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          invalid={Boolean(errors.confirmPassword)}
          required
        />
      </Field>

      <Button type="submit" block disabled={pending || !sent}>
        {pending ? labels.resetting : labels.reset}
      </Button>
    </form>
  );
}

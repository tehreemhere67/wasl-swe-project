"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, Field, TextInput } from "@/components/ui";

export interface DonorSignupLabels {
  name: string;
  mobile: string;
  sendCode: string;
  resend: string;
  code: string;
  codeHint: string;
  codeSent: string;
  consent: string;
  agree: string;
  password: string;
  confirmPassword: string;
  create: string;
  creating: string;
  errorOtpWrong: string;
  errorOtpExpired: string;
  errorOtpTooMany: string;
  errorCooldown: string;
  errorMobileTaken: string;
  errorConsent: string;
  errorCodeRequired: string;
  errorGeneric: string;
  validation: Record<string, string>;
  devCodeNote: string;
}

/** G-03 - Donor signup with OTP (FR-DON-01). */
export function DonorSignupForm({ labels }: { labels: DonorSignupLabels }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);

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
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile, purpose: "donor_signup" }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        devCode?: string;
        resendAfterSeconds?: number;
        error?: { code?: string; seconds?: number };
        errors?: { field: string; message: string }[];
      };

      if (data.ok) {
        setCodeRequested(true);
        setCooldown(data.resendAfterSeconds ?? 60);
        setDevCode(data.devCode ?? null);
        return;
      }

      if (data.error?.code === "mobile_taken") {
        setErrors({ mobile: labels.errorMobileTaken });
      } else if (data.error?.code === "cooldown") {
        setCooldown(data.error.seconds ?? 60);
        setTopError(labels.errorCooldown.replace("{seconds}", String(data.error.seconds ?? 60)));
      } else if (data.errors?.length) {
        const mapped: Record<string, string> = {};
        for (const error of data.errors) mapped[error.field] = labels.validation[error.message] ?? labels.errorGeneric;
        setErrors(mapped);
      } else {
        setTopError(labels.errorGeneric);
      }
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTopError(null);
    setErrors({});

    const local: Record<string, string> = {};
    if (!name.trim()) local.name = labels.validation.required ?? labels.errorGeneric;
    if (!mobile.trim()) local.mobile = labels.validation.required ?? labels.errorGeneric;
    if (!code.trim()) local.code = labels.errorCodeRequired;
    if (!password) local.password = labels.validation.required ?? labels.errorGeneric;
    if (password.length > 0 && password.length < 8) local.password = labels.validation.tooShort ?? labels.errorGeneric;
    if (password !== confirmPassword) local.confirmPassword = labels.validation.mismatch ?? labels.errorGeneric;
    if (!consent) local.consent = labels.errorConsent;
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/donor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, code, password, confirmPassword, consent }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        redirect?: string;
        error?: { code?: string; reason?: string };
        errors?: { field: string; message: string }[];
      };

      if (data.ok && data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }

      if (data.error?.code === "otp") {
        const map: Record<string, string> = {
          wrong: labels.errorOtpWrong,
          expired: labels.errorOtpExpired,
          too_many_attempts: labels.errorOtpTooMany,
          not_found: labels.errorOtpExpired,
        };
        setErrors({ code: map[data.error.reason ?? "wrong"] ?? labels.errorOtpWrong });
        return;
      }
      if (data.error?.code === "mobile_taken") {
        setErrors({ mobile: labels.errorMobileTaken });
        return;
      }
      if (data.errors?.length) {
        const mapped: Record<string, string> = {};
        for (const error of data.errors) mapped[error.field] = labels.validation[error.message] ?? labels.errorGeneric;
        setErrors(mapped);
        return;
      }
      setTopError(labels.errorGeneric);
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={createAccount} className="space-y-4" noValidate>
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      <Field label={labels.name} htmlFor="donor-name" required error={errors.name}>
        <TextInput
          id="donor-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          invalid={Boolean(errors.name)}
          required
        />
      </Field>

      <Field label={labels.mobile} htmlFor="donor-mobile" required error={errors.mobile}>
        <div className="flex gap-2">
          <TextInput
            id="donor-mobile"
            name="mobile"
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
            {cooldown > 0
              ? labels.resend.replace("{seconds}", String(cooldown))
              : sending
                ? "…"
                : labels.sendCode}
          </Button>
        </div>
      </Field>

      <Field
        label={labels.code}
        htmlFor="donor-code"
        required
        error={errors.code}
        hint={codeRequested ? labels.codeHint.replace("{mobile}", mobile) : undefined}
      >
        <TextInput
          id="donor-code"
          name="code"
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

      {codeRequested && devCode ? (
        <Alert tone="info">
          <span className="font-semibold">{labels.devCodeNote}</span>
          <span className="ms-2 font-mono text-base tracking-widest">{devCode}</span>
        </Alert>
      ) : null}

      {/* Consent - DR-03, drawn as a boxed statement in the wireframe */}
      <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
        <p className="text-sm leading-6 text-ink-700">{labels.consent}</p>
        <div className="mt-2">
          <Checkbox
            name="agree"
            label={labels.agree}
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
        </div>
        {errors.consent ? (
          <p className="error-text" role="alert">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <Field label={labels.password} htmlFor="donor-password" required error={errors.password}>
        <TextInput
          id="donor-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <Field label={labels.confirmPassword} htmlFor="donor-confirm" required error={errors.confirmPassword}>
        <TextInput
          id="donor-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          invalid={Boolean(errors.confirmPassword)}
          required
        />
      </Field>

      <Button type="submit" block disabled={pending}>
        {pending ? labels.creating : labels.create}
      </Button>
    </form>
  );
}

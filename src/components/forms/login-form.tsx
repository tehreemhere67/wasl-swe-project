"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, TextInput } from "@/components/ui";

export interface LoginLabels {
  identifier: string;
  identifierPlaceholder: string;
  password: string;
  login: string;
  loginPending: string;
  errorInvalid: string;
  errorLocked: string;
  errorDeactivated: string;
  errorRequired: string;
  errorNetwork: string;
}

/** G-01 login form. Talks to POST /api/auth/login. */
export function LoginForm({ labels, nextPath }: { labels: LoginLabels; nextPath?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError(labels.errorRequired);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        redirect?: string;
        error?: { code?: string; minutes?: number };
      };

      if (data.ok && data.redirect) {
        const target = nextPath && nextPath.startsWith("/") ? nextPath : data.redirect;
        router.push(target);
        router.refresh();
        return;
      }

      if (data.error?.code === "locked") {
        setError(labels.errorLocked.replace("{minutes}", String(data.error.minutes ?? 15)));
      } else if (data.error?.code === "deactivated") {
        setError(labels.errorDeactivated);
      } else {
        setError(labels.errorInvalid);
      }
    } catch {
      setError(labels.errorNetwork);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <Alert tone="error" role="alert">
          {error}
        </Alert>
      ) : null}

      <Field label={labels.identifier} htmlFor="identifier" required>
        <TextInput
          id="identifier"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder={labels.identifierPlaceholder}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          invalid={Boolean(error)}
          required
        />
      </Field>

      <Field label={labels.password} htmlFor="password" required>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(error)}
          required
        />
      </Field>

      <Button type="submit" block disabled={pending}>
        {pending ? labels.loginPending : labels.login}
      </Button>
    </form>
  );
}

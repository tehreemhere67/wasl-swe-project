import { query } from "@/lib/db";
import { isProduction } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { PublicShell } from "@/components/shell/app-shell";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { readDevOutbox } from "@/lib/messaging";

/**
 * Development-only view of the SMS outbox. When no messaging provider is
 * configured, one-time passcodes and notifications are written here instead of
 * being sent, so the flow can be demonstrated offline.
 */
export default async function DevOutboxPage() {
  if (isProduction()) {
    return (
      <PublicShell locale={await getLocale()}>
        <div className="mx-auto max-w-xl">
          <Card className="card-pad">
            <p className="text-sm text-ink-700">Not available in production.</p>
          </Card>
        </div>
      </PublicShell>
    );
  }

  const locale = await getLocale();
  const t = createTranslator(locale);
  const messages = await readDevOutbox(30);

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader title="Dev outbox" subtitle={t("notice.devMode")} />
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Send an OTP to see the message here." />
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <Card key={message.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-ink-900">{message.to_phone}</p>
                  <time className="text-xs text-ink-500">{formatDateTime(message.created_at, locale)}</time>
                </div>
                <p className="mt-1 text-sm text-ink-700">{message.body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

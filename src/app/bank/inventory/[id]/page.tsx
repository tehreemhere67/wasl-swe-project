import { notFound } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format";
import { BatchActions } from "@/components/forms/batch-actions";
import { ArchiveBatch } from "@/components/forms/archive-batch";
import { ReservationsPanel } from "@/components/forms/reservations-panel";
import { Alert, Badge, Card, CardHeader, DetailRow, LinkButton, PageHeader } from "@/components/ui";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getBatch, listReservations, listTransferTargets, type InventoryMovementView } from "@/lib/inventory/data";
import {
  buildBatchActionsLabels,
  buildReservationsLabels,
} from "@/lib/inventory/form-labels";
import {
  COMPONENT_LABEL_KEY,
  MOVEMENT_LABEL_KEY,
  TESTING_STATUS_LABEL_KEY,
  TESTING_STATUS_TONE,
} from "@/lib/inventory/labels";
import { formatMovementQuantity, type MovementType, type TestingStatus } from "@/lib/inventory/rules";

/**
 * B-04 - Batch detail + movements (FR-INV-03, FR-INV-05, FR-INV-06, A-08).
 *
 * Shows one batch of this blood bank and its movement history. 4.3 writes a
 * `Correction` movement for every edit; 4.4 and 4.5 extend the same history with
 * issue / discard / transfer and the remaining presentation details.
 *
 * The history is read-only by design: a movement is never edited or deleted, so
 * the quantity can always be explained (DR-05).
 */

/** Reads the structured note of a correction and returns its status change. */
function statusChangeFromNote(
  note: string | null,
): { from: string; to: string } | null {
  if (!note) return null;
  try {
    const parsed = JSON.parse(note) as Record<string, { from?: unknown; to?: unknown }>;
    const status = parsed.status;
    if (status && typeof status.from === "string" && typeof status.to === "string") {
      return { from: status.from, to: status.to };
    }
  } catch {
    return null;
  }
  return null;
}

function statusLabel(t: ReturnType<typeof createTranslator>, value: string): string {
  const key = TESTING_STATUS_LABEL_KEY[value as TestingStatus];
  return key ? t(key) : t("field.status");
}

/** A free-text note typed by staff (NFR-LOC-06: shown as entered, never translated). */
function noteText(note: string | null): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  if (trimmed === "" || trimmed.startsWith("{")) return null;
  return trimmed;
}

/**
 * The wireframe's summary line: "Added +10 Reserved -2 Issued -2".
 * Totals are per movement type over the whole history.
 */
function movementSummary(
  movements: InventoryMovementView[],
  t: ReturnType<typeof createTranslator>,
): string {
  const totals = new Map<MovementType, number>();
  for (const movement of movements) {
    totals.set(movement.type, (totals.get(movement.type) ?? 0) + movement.quantity);
  }

  const order: MovementType[] = [
    "added",
    "reserved",
    "reservation_released",
    "issued",
    "transferred_out",
    "expired",
    "discarded",
    "correction",
  ];

  return order
    .filter((type) => {
      const total = totals.get(type);
      return total !== undefined && total !== 0;
    })
    .map((type) => `${t(MOVEMENT_LABEL_KEY[type])} ${formatMovementQuantity(type, totals.get(type) ?? 0)}`)
    .join(" · ");
}

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireVerifiedOrganization("/bank/inventory");
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  const data = await getBatch(session.user.organization.id, id);
  if (!data) notFound();

  const { batch, movements } = data;
  const reservations = await listReservations(session.user.organization.id, batch.id);
  const transferTargets = await listTransferTargets(session.user.organization.id);
  const reservationRows = reservations.map((reservation) => ({
    id: reservation.id,
    label: t("inventory.reserve.until", {
      units: reservation.units,
      time: formatDateTime(reservation.holdUntil, locale),
    }),
  }));
  const freeUnits = Math.max(0, batch.units - batch.reservedUnits);

  const title = t("bank.batch.title", {
    group: t(`blood.${batch.bloodGroup}`),
    component: t(COMPONENT_LABEL_KEY[batch.component]),
  });

  return (
    <div>
      <PageHeader
        title={title}
        backLink={{ href: "/bank/inventory", label: t("inventory.back") }}
        actions={
          <LinkButton href={`/bank/inventory/${batch.id}/edit`} variant="secondary">
            {t("inventory.detail.edit")}
          </LinkButton>
        }
      />

      <Card className="px-5 py-2">
        <dl className="divide-y divide-ink-100">
          <DetailRow label={t("inventory.col.group")} value={t(`blood.${batch.bloodGroup}`)} />
          <DetailRow
            label={t("inventory.col.component")}
            value={t(COMPONENT_LABEL_KEY[batch.component])}
          />
          <DetailRow
            label={t("inventory.col.status")}
            value={
              <Badge tone={TESTING_STATUS_TONE[batch.status]}>
                {t(TESTING_STATUS_LABEL_KEY[batch.status])}
              </Badge>
            }
          />
          <DetailRow label={t("inventory.col.available")} value={batch.availableUnits} />
          <DetailRow label={t("inventory.col.reserved")} value={batch.reservedUnits} />
          <DetailRow label={t("inventory.detail.unitsHeld")} value={batch.units} />
          <DetailRow
            label={t("inventory.col.expiry")}
            value={formatDate(batch.expiresAt, locale)}
          />
          <DetailRow label={t("inventory.detail.addedBy")} value={batch.createdByName ?? "—"} />
          <DetailRow
            label={t("inventory.detail.addedOn")}
            value={formatDateTime(batch.createdAt, locale)}
          />
        </dl>
      </Card>

      {batch.archivedAt ? (
        <Alert tone="info">
          {t("inventory.archive.notice", { date: formatDate(batch.archivedAt, locale) })}
        </Alert>
      ) : (
        <>
          <Card className="mt-4">
            <CardHeader title={t("inventory.action.title")} />
            <div className="px-5 py-4">
              <BatchActions
                batchId={batch.id}
                unitsHeld={batch.units}
                transferTargets={transferTargets.map((target) => ({
                  id: target.id,
                  name: target.name,
                }))}
                labels={buildBatchActionsLabels(t, batch.units)}
              />
            </div>
          </Card>

          <Card className="mt-4">
            <CardHeader title={t("inventory.reserve.title")} />
            <div className="px-5 py-4">
              <ReservationsPanel
                batchId={batch.id}
                freeUnits={freeUnits}
                reservations={reservationRows}
                labels={buildReservationsLabels(t)}
              />
            </div>
          </Card>

          {batch.units === 0 ? (
            <ArchiveBatch
              batchId={batch.id}
              labels={{
                action: t("inventory.archive.action"),
                hint: t("inventory.archive.hint"),
                working: t("inventory.archive.working"),
                error: t("inventory.archive.error"),
              }}
            />
          ) : null}
        </>
      )}

      <Card className="mt-4">
        <CardHeader title={t("inventory.detail.movements")} />
        {movements.length > 0 ? (
          <p className="px-5 pt-3 text-sm text-ink-600">{movementSummary(movements, t)}</p>
        ) : null}
        {movements.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-500">{t("inventory.detail.noMovements")}</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {movements.map((movement) => {
              const statusChange = statusChangeFromNote(movement.note);
              const note = noteText(movement.note);
              return (
                <li key={movement.id} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-ink-900">
                      {t(MOVEMENT_LABEL_KEY[movement.type])}
                    </p>
                    <span className="font-mono text-sm font-semibold text-ink-800">
                      {formatMovementQuantity(movement.type, movement.quantity)}
                    </span>
                  </div>
                  {statusChange ? (
                    <p className="mt-0.5 text-xs text-ink-600">
                      {t("inventory.movement.statusChanged", {
                        from: statusLabel(t, statusChange.from),
                        to: statusLabel(t, statusChange.to),
                      })}
                    </p>
                  ) : null}
                  {note ? <p className="mt-0.5 text-xs text-ink-600">{note}</p> : null}
                  {movement.relatedOrganizationName ? (
                    <p className="mt-0.5 text-xs text-ink-600">
                      {t("inventory.movement.transferredTo", {
                        bank: movement.relatedOrganizationName,
                      })}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-ink-500">
                    {movement.actorName ?? "—"} · {formatDateTime(movement.createdAt, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

/**
 * Wasl database migrations.
 *
 * These are plain PostgreSQL statements, so the exact same schema runs on the
 * embedded PostgreSQL (PGlite) used for local development and on a real
 * PostgreSQL server in staging/production.
 *
 * Conventions
 * - Every table has a UUID primary key.
 * - Timestamps are `timestamptz` and always stored in UTC; the UI renders them
 *   in PKT (Asia/Karachi) as required by NFR-LOC-05.
 * - Controlled values from SRS section 4.2 are enforced with CHECK constraints
 *   so that an invalid status cannot be stored even if application code is wrong.
 *
 * Modules owned by other team members add their own migration files
 * (e.g. 010_inventory.ts) and must not edit the migrations below once shared.
 */

export interface Migration {
  id: string;
  name: string;
  sql: string;
}

const initialSchema = `
-- ---------------------------------------------------------------------------
-- Organizations: hospitals, blood banks and donation organizations.
-- FR-VER-01, FR-VER-02, SRS 4.1/4.2 (verification status)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                        TEXT NOT NULL
                              CHECK (type IN ('hospital', 'blood_bank', 'donation_org')),
  name                        TEXT NOT NULL,
  address_karachi             TEXT NOT NULL,
  area                        TEXT,
  official_phone              TEXT NOT NULL,
  official_email              TEXT NOT NULL,
  licence_number              TEXT NOT NULL,
  representative_name         TEXT NOT NULL,
  representative_designation  TEXT NOT NULL,
  verification_status         TEXT NOT NULL DEFAULT 'pending'
                              CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  status_reason               TEXT,
  verified_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations (verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations (type);

-- Supporting documents (licence certificate etc). Stored as bytes so the
-- platform has no external file-store dependency. DR-04: visible only to
-- administrators and to the submitting organization.
CREATE TABLE IF NOT EXISTS organization_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  size_bytes       INTEGER NOT NULL CHECK (size_bytes > 0),
  content          BYTEA NOT NULL,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_documents_org ON organization_documents (organization_id);

-- FR-VER-02 / FR-VER-04: every administrator decision with who, when, why.
CREATE TABLE IF NOT EXISTS verification_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  admin_user_id    UUID,
  decision         TEXT NOT NULL
                   CHECK (decision IN ('approved', 'rejected', 'suspended', 'reinstated', 'reapplied')),
  reason           TEXT,
  decided_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_history_org ON verification_history (organization_id, decided_at DESC);

-- ---------------------------------------------------------------------------
-- Users: one account per staff member, donor or administrator.
-- A-02: an organization has one organization account with one or more staff users.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role                  TEXT NOT NULL
                        CHECK (role IN ('admin', 'hospital', 'blood_bank', 'donation_org', 'donor')),
  email                 TEXT UNIQUE,
  phone                 TEXT UNIQUE,
  password_hash         TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  organization_id       UUID REFERENCES organizations (id) ON DELETE SET NULL,
  preferred_language    TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur')),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  last_login_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (role = 'donor' AND phone IS NOT NULL AND email IS NULL)
    OR (role <> 'donor' AND email IS NOT NULL)
  ),
  CHECK (
    (role IN ('admin', 'donor') AND organization_id IS NULL)
    OR (role IN ('hospital', 'blood_bank', 'donation_org') AND organization_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_org ON users (organization_id);

-- FR-DON-01/02, FR-DON-05, DR-03. A donor profile is created after the mobile
-- number is confirmed by one-time passcode.
CREATE TABLE IF NOT EXISTS donors (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  mobile                  TEXT NOT NULL,
  blood_group             TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  area                    TEXT,
  availability            TEXT NOT NULL DEFAULT 'available'
                          CHECK (availability IN ('available', 'not_available')),
  contact_platform        BOOLEAN NOT NULL DEFAULT true,
  contact_sms             BOOLEAN NOT NULL DEFAULT false,
  contact_whatsapp        BOOLEAN NOT NULL DEFAULT false,
  notify_urgent           BOOLEAN NOT NULL DEFAULT true,
  notify_campaigns        BOOLEAN NOT NULL DEFAULT true,
  preferred_language      TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur')),
  consent_share_contact_at TIMESTAMPTZ,
  reminder_days           INTEGER CHECK (reminder_days IS NULL OR (reminder_days BETWEEN 1 AND 365)),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors (blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_area ON donors (area);

-- ---------------------------------------------------------------------------
-- Sessions. NFR-SEC-02: a session ends after 30 minutes without activity.
-- Only a hash of the bearer token is stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- One-time passcodes: donor signup (FR-DON-01) and password reset.
CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('donor_signup', 'password_reset')),
  code_hash    TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes (phone, purpose, created_at DESC);

-- FR-ADM-05: audit log of significant actions.
CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID,
  actor_role     TEXT,
  action         TEXT NOT NULL,
  entity_type    TEXT,
  entity_id      TEXT,
  details        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log (action);

-- FR-NOT-04: every notification is also stored in the in-platform notification
-- centre, so it is available even when SMS/WhatsApp fails.
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  title_en         TEXT NOT NULL,
  title_ur         TEXT NOT NULL,
  body_en          TEXT,
  body_ur          TEXT,
  link             TEXT,
  delivery_status  TEXT NOT NULL DEFAULT 'in_platform'
                   CHECK (delivery_status IN ('in_platform', 'sent', 'delivered', 'failed')),
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

-- FR-ADM-10: administrator-maintained settings (thresholds, distances, areas...).
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Development SMS outbox. In production the messaging provider is used and
-- this table is simply never written to.
CREATE TABLE IF NOT EXISTS dev_outbox (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone    TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration bookkeeping.
CREATE TABLE IF NOT EXISTS schema_migrations (
  id          TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const seedSettings = `
INSERT INTO settings (key, value) VALUES
  ('matching', '{
      "critical_distance_km": 30,
      "urgent_distance_km": 15,
      "campaign_notice_distance_km": 15,
      "proximity_weight": 0.6,
      "recency_weight": 0.4,
      "recency_cap_days": 180,
      "minimum_notification_interval_days": 90,
      "urgent_escalation_after_hours": 2,
      "urgent_escalation_batch": 50,
      "critical_escalation_after_minutes": 30,
      "critical_distance_extension_km": 10,
      "reservation_hold_hours": 6
   }'::jsonb),
  ('monitoring', '{
      "default_low_stock_threshold": 5,
      "expiry_warning_days": {
        "Platelets": 2,
        "Whole blood": 7,
        "Red blood cells": 7,
        "Plasma": 30
      },
      "alert_repeat_hours": 24,
      "evaluation_interval_minutes": 60
   }'::jsonb),
  ('karachi_areas', '[
      {"name_en": "Saddar",              "name_ur": "صدر",              "lat": 24.8607, "lng": 67.0011},
      {"name_en": "Clifton",             "name_ur": "کلفٹن",            "lat": 24.8138, "lng": 67.0299},
      {"name_en": "DHA",                 "name_ur": "ڈی ایچ اے",        "lat": 24.8020, "lng": 67.0630},
      {"name_en": "PECHS",               "name_ur": "پی ای سی ایچ ایس", "lat": 24.8710, "lng": 67.0650},
      {"name_en": "Tariq Road",          "name_ur": "طارق روڈ",         "lat": 24.8755, "lng": 67.0570},
      {"name_en": "Gulshan-e-Iqbal",     "name_ur": "گلشن اقبال",       "lat": 24.9200, "lng": 67.0900},
      {"name_en": "Gulistan-e-Johar",    "name_ur": "گلستان جوہر",      "lat": 24.9300, "lng": 67.1300},
      {"name_en": "North Nazimabad",     "name_ur": "نارتھ ناظم آباد",  "lat": 24.9400, "lng": 67.0400},
      {"name_en": "Nazimabad",           "name_ur": "ناظم آباد",        "lat": 24.9200, "lng": 67.0300},
      {"name_en": "Federal B Area",      "name_ur": "فیڈرل بی ایریا",   "lat": 24.9350, "lng": 67.0650},
      {"name_en": "Gulberg",             "name_ur": "گلبرگ",            "lat": 24.9250, "lng": 67.0750},
      {"name_en": "Scheme 33",           "name_ur": "اسکیم 33",         "lat": 24.9550, "lng": 67.1100},
      {"name_en": "Malir",               "name_ur": "ملیر",             "lat": 24.8939, "lng": 67.2080},
      {"name_en": "Shah Faisal",         "name_ur": "شاہ فیصل",         "lat": 24.8760, "lng": 67.1620},
      {"name_en": "Korangi",             "name_ur": "کورنگی",           "lat": 24.8300, "lng": 67.1300},
      {"name_en": "Landhi",              "name_ur": "لنڈھی",            "lat": 24.8500, "lng": 67.1900},
      {"name_en": "Bin Qasim",           "name_ur": "بن قاسم",          "lat": 24.8200, "lng": 67.3500},
      {"name_en": "Lyari",               "name_ur": "لیاری",            "lat": 24.8600, "lng": 66.9900},
      {"name_en": "Keamari",             "name_ur": "کیماڑی",           "lat": 24.8300, "lng": 66.9700},
      {"name_en": "Orangi",              "name_ur": "اورنگی",           "lat": 24.9500, "lng": 66.9800},
      {"name_en": "Baldia",              "name_ur": "بلدیہ",            "lat": 24.9100, "lng": 66.9200},
      {"name_en": "Surjani Town",        "name_ur": "سورجانی ٹاؤن",     "lat": 24.9900, "lng": 67.0400},
      {"name_en": "SITE",                "name_ur": "سائٹ",             "lat": 24.8950, "lng": 66.9900},
      {"name_en": "Manghopir",           "name_ur": "منگھوپیر",         "lat": 24.9700, "lng": 67.0000},
      {"name_en": "Gadap",               "name_ur": "گڈاپ",             "lat": 25.0200, "lng": 67.1300},
      {"name_en": "Bahria Town",         "name_ur": "بحریہ ٹاؤن",       "lat": 24.8300, "lng": 67.2700}
   ]'::jsonb),
  ('platform', '{
      "organisation_types": ["hospital", "blood_bank", "donation_org"],
      "onboarding_enabled": true
   }'::jsonb)
ON CONFLICT (key) DO NOTHING;
`;

export const MIGRATIONS: Migration[] = [
  {
    id: "001_initial_schema",
    name: "Initial schema - organizations, users, donors, sessions, otp, audit, notifications, settings",
    sql: initialSchema,
  },
  {
    id: "002_default_settings",
    name: "Default administrator-maintained settings (SRS defaults / assumptions)",
    sql: seedSettings,
  },

  //Member 2 Sprint 1: A-04 campaign review
    {
    id: "003_campaigns",
    name: "Campaigns submitted for administrator review (M6/M2)",
    sql: `
-- M6: donation campaigns. Owner: Member 4; A-04 reads and reviews them.
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  title_en        TEXT NOT NULL,
  title_ur        TEXT NOT NULL,
  description_en  TEXT NOT NULL DEFAULT '',
  description_ur  TEXT NOT NULL DEFAULT '',
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  venue           TEXT NOT NULL,
  area            TEXT,
  target_groups   TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_approval','approved','rejected','cancelled','completed')),
  review_reason   TEXT,
  reviewed_by     UUID REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns (organization_id);
`,
  },

  // Member 3, Sprint 1: Module 4 (inventory) + Module 7 (expiry / low-stock monitoring).
  // One row per batch, never per bag (A-08). Available quantity is
  // `units` minus the units held by active reservations - see src/lib/inventory/rules.ts.
  {
    id: "004_inventory",
    name: "Inventory batches, movements, reservations, thresholds, alerts and per-bank monitoring settings (M4/M7)",
    sql: `
-- M4 FR-INV-01/02: a batch of blood owned by one blood bank.
CREATE TABLE IF NOT EXISTS inventory_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  blood_group      TEXT NOT NULL
                   CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  component        TEXT NOT NULL
                   CHECK (component IN ('Whole blood', 'Red blood cells', 'Platelets', 'Plasma')),
  -- Units physically held. Never negative (DR-01); a batch may reach 0 and stays
  -- in the table so its movement history is preserved (FR-INV-03).
  units            INTEGER NOT NULL DEFAULT 0 CHECK (units >= 0),
  -- Testing and approval status entered by staff; Wasl never tests blood (A-09).
  status           TEXT NOT NULL DEFAULT 'awaiting_testing'
                   CHECK (status IN ('awaiting_testing', 'approved', 'rejected')),
  expires_at       TIMESTAMPTZ NOT NULL,
  created_by       UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_org
  ON inventory_batches (organization_id, blood_group, component);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_status
  ON inventory_batches (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry
  ON inventory_batches (expires_at);

-- M4 FR-INV-03/05/06 + A-08: the permanent log of every change to a batch.
-- The quantity column is a SIGNED delta so the movement rows explain the units:
--   added +, issued -, transferred_out -, expired -, discarded -,
--   reserved -, reservation_released +, correction either sign.
CREATE TABLE IF NOT EXISTS inventory_movements (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id                UUID NOT NULL REFERENCES inventory_batches (id) ON DELETE CASCADE,
  organization_id         UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  movement_type           TEXT NOT NULL
                          CHECK (movement_type IN ('added', 'reserved', 'reservation_released',
                                                   'issued', 'transferred_out', 'expired',
                                                   'discarded', 'correction')),
  quantity                INTEGER NOT NULL CHECK (quantity <> 0),
  note                    TEXT,
  -- Sprint 2 links this to a hospital blood request. Kept as TEXT for now so the
  -- inventory module does not depend on a requests table that does not exist yet.
  related_request_id      TEXT,
  -- FR-INV-06 / A-11: the receiving blood bank of a transfer out.
  related_organization_id UUID REFERENCES organizations (id) ON DELETE SET NULL,
  actor_user_id           UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch
  ON inventory_movements (batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org
  ON inventory_movements (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type
  ON inventory_movements (movement_type);

-- M4 FR-INV-04 / A-10: units set aside for a hospital, released by the bank or
-- automatically after the hold period (default 6 hours).
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID NOT NULL REFERENCES inventory_batches (id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  units            INTEGER NOT NULL CHECK (units > 0),
  request_id       TEXT,
  hold_until       TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'released', 'consumed')),
  created_by       UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_batch
  ON inventory_reservations (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_hold
  ON inventory_reservations (status, hold_until);

-- M7 FR-MON-03/04 / A-05: each bank's own low-stock threshold per group + component.
-- No row means "use the default of 5 units".
CREATE TABLE IF NOT EXISTS stock_thresholds (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  blood_group      TEXT NOT NULL
                   CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  component        TEXT NOT NULL
                   CHECK (component IN ('Whole blood', 'Red blood cells', 'Platelets', 'Plasma')),
  threshold_units  INTEGER NOT NULL CHECK (threshold_units >= 0),
  updated_by       UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, blood_group, component)
);

-- M7 FR-MON-05 / A-32: alerts raised for a bank, with acknowledgement and the
-- 24-hour no-repeat rule. The dedupe_key column identifies the condition (e.g. expiry of
-- batch X, or low stock of O- red cells) so the same condition is not re-raised.
CREATE TABLE IF NOT EXISTS stock_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  alert_type       TEXT NOT NULL CHECK (alert_type IN ('expiry', 'low_stock')),
  batch_id         UUID REFERENCES inventory_batches (id) ON DELETE SET NULL,
  blood_group      TEXT NOT NULL
                   CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  component        TEXT NOT NULL
                   CHECK (component IN ('Whole blood', 'Red blood cells', 'Platelets', 'Plasma')),
  quantity         INTEGER NOT NULL,
  expires_at       TIMESTAMPTZ,
  dedupe_key       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'acknowledged', 'resolved')),
  raised_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_raised_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_by  UUID REFERENCES users (id) ON DELETE SET NULL,
  acknowledged_at  TIMESTAMPTZ
);

-- At most one ACTIVE alert per condition per bank.
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_active
  ON stock_alerts (organization_id, dedupe_key) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_alerts_org
  ON stock_alerts (organization_id, status, raised_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_batch
  ON stock_alerts (batch_id);

-- M7 FR-MON-01/05: this bank's warning windows and SMS preference (B-05), plus
-- the timestamp of the last monitoring sweep for the hourly guard (FR-MON-06).
CREATE TABLE IF NOT EXISTS bank_monitoring_settings (
  organization_id     UUID PRIMARY KEY REFERENCES organizations (id) ON DELETE CASCADE,
  expiry_warning_days JSONB NOT NULL DEFAULT '{"Platelets": 2, "Whole blood": 7, "Red blood cells": 7, "Plasma": 30}'::jsonb,
  sms_alerts          BOOLEAN NOT NULL DEFAULT false,
  last_sweep_at       TIMESTAMPTZ,
  updated_by          UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,
  },

  // Member 3, Sprint 1: 4.3 needs to record a status-only change as a movement.
  // A correction that changes no units carries quantity 0; every other movement
  // type must still move at least one unit (FR-INV-03, DR-01).
  {
    id: "005_inventory_correction_zero",
    name: "Allow a correction movement with quantity 0 (status-only edits)",
    sql: `
ALTER TABLE inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_quantity_check;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_quantity_check
  CHECK (quantity <> 0 OR movement_type = 'correction');
`,
  },

  // Member 3, Sprint 1: hide an empty batch from the list without deleting it.
  // 4.4 keeps every record (DR-05), so removal is a soft archive: the row and its
  // full movement history stay and remain reachable by direct link.
  {
    id: "006_inventory_archive",
    name: "Archive empty inventory batches instead of deleting them",
    sql: `
ALTER TABLE inventory_batches
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_inventory_batches_active
  ON inventory_batches (organization_id, expires_at)
  WHERE archived_at IS NULL;
`,
  },

  // Member 4, Sprint 1: Module 3 (donor profile, donation history, reminders) and
  // Module 6 (campaign interest, edits that need re-approval, outcomes). Additive only:
  // 001..006 are untouched.
  {
    id: "007_donor_campaign_m4",
    name: "Donation history, campaign interest, campaign contact/outcome/snapshot columns, donor reminder tracking (M3/M6)",
    sql: `
-- FR-DON-03 / FR-DON-04 / A-19: two kinds of entry, both count towards the total.
-- donor_id is set to NULL (not deleted) when a donor deletes their account, so only an
-- anonymous total remains (DR-05).
CREATE TABLE IF NOT EXISTS donation_history (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id                    UUID REFERENCES donors (id) ON DELETE SET NULL,
  donated_on                  DATE NOT NULL,
  place                       TEXT NOT NULL,
  source                      TEXT NOT NULL CHECK (source IN ('self_reported', 'recorded_by_org')),
  recorded_by_organization_id UUID REFERENCES organizations (id) ON DELETE SET NULL,
  campaign_id                 UUID REFERENCES campaigns (id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donation_history_donor ON donation_history (donor_id, donated_on DESC);

-- A donor is recorded at most once per campaign.
CREATE UNIQUE INDEX IF NOT EXISTS uq_donation_history_campaign_donor
  ON donation_history (campaign_id, donor_id)
  WHERE campaign_id IS NOT NULL AND donor_id IS NOT NULL;

-- FR-CAM-07 / A-30: non-binding "I plan to attend".
CREATE TABLE IF NOT EXISTS campaign_interests (
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  donor_id    UUID NOT NULL REFERENCES donors (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, donor_id)
);

-- FR-CAM-01 contact details, FR-CAM-09 outcomes, FR-CAM-08 / A-29 approved version kept while
-- an edited campaign waits for the administrator.
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_phone        TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_email        TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS attendees            INTEGER CHECK (attendees IS NULL OR attendees >= 0);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donations_count      INTEGER CHECK (donations_count IS NULL OR donations_count >= 0);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS outcome_recorded_at  TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS approved_snapshot    JSONB;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ;

-- FR-DON-06: remember which last donation a reminder was already sent for.
ALTER TABLE donors ADD COLUMN IF NOT EXISTS reminder_last_sent_for DATE;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS deleted_at             TIMESTAMPTZ;
`,
  },
];

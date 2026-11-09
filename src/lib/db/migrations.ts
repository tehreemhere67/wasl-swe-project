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
];

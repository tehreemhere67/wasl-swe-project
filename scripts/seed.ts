/**
 * `pnpm db:seed` - makes the app demoable.
 *
 * Creates:
 *  - the one administrator account (Module 1.6: no public administrator signup)
 *  - one verified hospital, one verified blood bank, one verified donation
 *    organization (so every role can log in and see its own area)
 *  - a SECOND verified blood bank ("Clifton Community Blood Bank", bank2@demo.wasl)
 *    purely as demo/test data for Module 4.7 transfers: a transfer needs a
 *    receiving verified bank, and the demo previously had only one. It is a
 *    test bank, not a real Karachi blood bank; later sprints can reuse it for
 *    request offers and for multi-bank hospital search results.
 *  - one Pending hospital and one Rejected organization with reasons, so the
 *    administrator verification queue (A-02) and the status screen (G-04) are
 *    not empty
 *  - one donor account with a profile
 *  - a few audit/notification rows
 *
 * Running it twice is safe.
 */
import { connect, migrate } from "./connect.ts";
import { hashPassword } from "../src/lib/auth/password.ts";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "WaslDemo#2026";

// A 1x1 transparent PNG, used as a placeholder supporting document.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

interface SeedOrganization {
  type: "hospital" | "blood_bank" | "donation_org";
  name: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  licence: string;
  representative: string;
  designation: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  reason?: string | null;
  userPassword?: string;
}

const ORGANIZATIONS: SeedOrganization[] = [
  {
    type: "hospital",
    name: "Aga Khan University Hospital",
    area: "Gulshan-e-Iqbal",
    address: "Stadium Road, Karachi",
    phone: "+923001111001",
    email: "hospital@demo.wasl",
    licence: "HOSP-KHI-1001",
    representative: "Dr. Sana Ahmed",
    designation: "Medical Superintendent",
    status: "verified",
  },
  {
    type: "blood_bank",
    name: "Karachi Blood Bank",
    area: "Saddar",
    address: "M.A. Jinnah Road, Saddar, Karachi",
    phone: "+923001111002",
    email: "bank@demo.wasl",
    licence: "BB-KHI-2002",
    representative: "Mr. Bilal Khan",
    designation: "Blood Bank Manager",
    status: "verified",
  },
  {
    // DEMO / TEST DATA - Member 3, Module 4.7.
    // A transfer is recorded by the sending bank and again by the receiving bank,
    // so the demo needs a second VERIFIED blood bank to transfer to. This is not a
    // real Karachi blood bank; keep it for demos and later sprints (request offers,
    // multi-bank search results).
    type: "blood_bank",
    name: "Clifton Community Blood Bank",
    area: "Clifton",
    address: "Khayaban-e-Roomi, Clifton, Karachi",
    phone: "+923001111006",
    email: "bank2@demo.wasl",
    licence: "BB-KHI-2006",
    representative: "Ms. Ayesha Siddiqui",
    designation: "Blood Bank Manager",
    status: "verified",
  },
  {
    type: "donation_org",
    name: "Wasl Founding Initiative",
    area: "Clifton",
    address: "Khayaban-e-Saadi, Clifton, Karachi",
    phone: "+923001111003",
    email: "organizer@demo.wasl",
    licence: "ORG-KHI-3003",
    representative: "Ms. Hina Raza",
    designation: "Programme Lead",
    status: "verified",
  },
  {
    type: "hospital",
    name: "Jinnah Postgraduate Medical Centre",
    area: "Saddar",
    address: "Rafiqui Shaheed Road, Karachi",
    phone: "+923001111004",
    email: "pending@demo.wasl",
    licence: "HOSP-KHI-1004",
    representative: "Dr. Imran Ali",
    designation: "Deputy Director",
    status: "pending",
  },
  {
    type: "blood_bank",
    name: "Karachi Metropolitan Blood Centre",
    area: "North Nazimabad",
    address: "Block H, North Nazimabad, Karachi",
    phone: "+923001111005",
    email: "rejected@demo.wasl",
    licence: "BB-KHI-2005",
    representative: "Mr. Adeel Sheikh",
    designation: "Administrator",
    status: "rejected",
    reason: "The uploaded licence document had expired. Please reapply with a valid licence.",
  },
];

async function ensureAdmin(
  db: Awaited<ReturnType<typeof connect>>,
): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "admin@wasl.pk").toLowerCase();
  const existing = await db.query<{ id: string }>("SELECT id FROM users WHERE lower(email) = $1", [email]);
  if (existing.rows.length > 0) {
    console.log(`  = admin already exists (${email})`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD || "WaslAdmin#2026";
  const name = process.env.ADMIN_NAME || "Wasl Administrator";
  const phone = process.env.ADMIN_PHONE || "+923000000000";
  const hash = await hashPassword(password);

  await db.query(
    `INSERT INTO users (role, email, phone, password_hash, full_name, status)
     VALUES ('admin', $1, $2, $3, $4, 'active')`,
    [email, phone, hash, name],
  );
  console.log(`  + admin ${email}`);
}

async function ensureOrganization(
  db: Awaited<ReturnType<typeof connect>>,
  org: SeedOrganization,
  passwordHash: string,
): Promise<void> {
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM organizations WHERE lower(official_email) = $1",
    [org.email.toLowerCase()],
  );

  let organizationId: string;
  if (existing.rows.length > 0) {
    organizationId = existing.rows[0].id;
    console.log(`  = organization already exists (${org.name})`);
  } else {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO organizations
         (type, name, address_karachi, area, official_phone, official_email, licence_number,
          representative_name, representative_designation, verification_status, status_reason, verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        org.type,
        org.name,
        org.address,
        org.area,
        org.phone,
        org.email.toLowerCase(),
        org.licence,
        org.representative,
        org.designation,
        org.status,
        org.reason ?? null,
        org.status === "verified" ? new Date().toISOString() : null,
      ],
    );
    organizationId = inserted.rows[0].id;

    await db.query(
      `INSERT INTO organization_documents (organization_id, file_name, mime_type, size_bytes, content)
       VALUES ($1, $2, 'image/png', $3, $4)`,
      [organizationId, `${org.licence}-licence.png`, PLACEHOLDER_PNG.length, PLACEHOLDER_PNG],
    );

    console.log(`  + organization ${org.name} (${org.status})`);
  }

  const userExisting = await db.query<{ id: string }>("SELECT id FROM users WHERE lower(email) = $1", [
    org.email.toLowerCase(),
  ]);
  let userId: string;
  if (userExisting.rows.length > 0) {
    userId = userExisting.rows[0].id;
  } else {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO users (role, email, phone, password_hash, full_name, status, organization_id, preferred_language)
       VALUES ($1,$2,$3,$4,$5,'active',$6,'en')
       RETURNING id`,
      [org.type, org.email.toLowerCase(), org.phone, passwordHash, org.representative, organizationId],
    );
    userId = inserted.rows[0].id;
    console.log(`  + user ${org.email}`);
  }

  // One history row per seeded organization so G-04 and A-02 have content.
  const history = await db.query<{ id: string }>(
    "SELECT id FROM verification_history WHERE organization_id = $1",
    [organizationId],
  );
  if (history.rows.length === 0 && org.status !== "pending") {
    const admin = await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    await db.query(
      `INSERT INTO verification_history (organization_id, admin_user_id, decision, reason)
       VALUES ($1, $2, $3, $4)`,
      [
        organizationId,
        admin.rows[0]?.id ?? null,
        org.status === "verified" ? "approved" : "rejected",
        org.reason ?? null,
      ],
    );
  }

  // A registration notification for the organization user (G-05).
  const notification = await db.query<{ id: string }>(
    "SELECT id FROM notifications WHERE user_id = $1 LIMIT 1",
    [userId],
  );
  if (notification.rows.length === 0) {
    const copy =
      org.status === "verified"
        ? {
            titleEn: "Registration approved",
            titleUr: "رجسٹریشن منظور ہو گئی",
            bodyEn: "Your organization is verified. You can now use its operational features.",
            bodyUr: "آپ کی تنظیم تصدیق ہو گئی۔ اب آپ اس کی آپریشنل خصوصیات استعمال کر سکتے ہیں۔",
          }
        : org.status === "pending"
          ? {
              titleEn: "Registration received",
              titleUr: "رجسٹریشن موصول ہو گئی",
              bodyEn: "Your registration is Pending until an administrator reviews it.",
              bodyUr: "منتظم کے جائزے تک آپ کی رجسٹریشن زیرِ التوا ہے۔",
            }
          : {
              titleEn: "Registration rejected",
              titleUr: "رجسٹریشن مسترد ہو گئی",
              bodyEn: org.reason ?? "The registration was rejected.",
              bodyUr: org.reason ?? "رجسٹریشن مسترد کر دی گئی۔",
            };

    await db.query(
      `INSERT INTO notifications (user_id, category, title_en, title_ur, body_en, body_ur, link)
       VALUES ($1, 'verification', $2, $3, $4, $5, '/status')`,
      [userId, copy.titleEn, copy.titleUr, copy.bodyEn, copy.bodyUr],
    );
  }
}

async function ensureDonor(db: Awaited<ReturnType<typeof connect>>, passwordHash: string): Promise<void> {
  const phone = "+923009876543";
  const existing = await db.query<{ id: string }>("SELECT id FROM users WHERE phone = $1", [phone]);
  if (existing.rows.length > 0) {
    console.log("  = donor already exists");
    return;
  }

  const user = await db.query<{ id: string }>(
    `INSERT INTO users (role, phone, password_hash, full_name, status, preferred_language)
     VALUES ('donor', $1, $2, $3, 'active', 'en')
     RETURNING id`,
    [phone, passwordHash, "Ali Raza"],
  );

  await db.query(
    `INSERT INTO donors
       (user_id, name, mobile, blood_group, area, availability,
        contact_platform, contact_sms, contact_whatsapp,
        notify_urgent, notify_campaigns, preferred_language, consent_share_contact_at)
     VALUES ($1, $2, $3, 'O-', 'Saddar', 'available', true, true, false, true, true, 'en', now())`,
    [user.rows[0].id, "Ali Raza", phone],
  );

  await db.query(
    `INSERT INTO notifications (user_id, category, title_en, title_ur, body_en, body_ur, link)
     VALUES ($1, 'account', 'Welcome to Wasl', 'واصل میں خوش آمدید',
             'Complete your profile to be considered for nearby requests and campaigns.',
             'قریبی درخواستوں اور مہموں کے لیے زیرِ غور آنے کے لیے اپنا پروفائل مکمل کریں۔',
             '/donor/profile')`,
    [user.rows[0].id],
  );

  console.log(`  + donor ${phone}`);
}

async function adminQueueNotification(db: Awaited<ReturnType<typeof connect>>): Promise<void> {
  const admin = await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admin.rows.length === 0) return;
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM notifications WHERE user_id = $1 AND category = 'general' LIMIT 1",
    [admin.rows[0].id],
  );
  if (existing.rows.length > 0) return;

  await db.query(
    `INSERT INTO notifications (user_id, category, title_en, title_ur, body_en, body_ur, link)
     VALUES ($1, 'general', 'Registrations waiting for review', 'جائزے کے لیے رجسٹریشنز زیرِ التوا',
             'There are organizations waiting for verification.',
             'کچھ تنظیمیں تصدیق کے انتظار میں ہیں۔', '/admin/verifications')`,
    [admin.rows[0].id],
  );
}

//Member 2 Sprint 1: A-04 campaign review

async function ensureCampaign(db: Awaited<ReturnType<typeof connect>>): Promise<void> {
  const org = await db.query<{ id: string }>(
    "SELECT id FROM organizations WHERE lower(official_email) = 'organizer@demo.wasl' LIMIT 1",
  );
  const organizationId = org.rows[0]?.id;
  if (!organizationId) return;

  const existing = await db.query<{ id: string }>(
    "SELECT id FROM campaigns WHERE organization_id = $1 LIMIT 1",
    [organizationId],
  );
  if (existing.rows.length > 0) {
    console.log("  = campaign already exists");
    return;
  }

  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO campaigns
       (organization_id, title_en, title_ur, description_en, description_ur,
        starts_at, ends_at, venue, area, target_groups, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], 'pending_approval')`,
    [
      organizationId,
      "Clifton Community Blood Drive",
      "کلفٹن کمیونٹی بلڈ ڈرائیو",
      "A community donation drive open to walk-in donors.",
      "عطیہ دہندگان کے لیے کھلی کمیونٹی ڈرائیو۔",
      startsAt.toISOString(),
      endsAt.toISOString(),
      "Clifton Community Hall",
      "Clifton",
      '{"O+","O-","B+"}',
    ],
  );
  console.log("  + campaign awaiting review (A-04)");
}

//Member 4 Sprint 1: demo campaigns for D-05 / D-06 / O-02 / O-03 and demo history for D-04

async function ensureMember4Demo(db: Awaited<ReturnType<typeof connect>>): Promise<void> {
  const org = await db.query<{ id: string }>(
    "SELECT id FROM organizations WHERE lower(official_email) = 'organizer@demo.wasl' LIMIT 1",
  );
  const organizationId = org.rows[0]?.id;
  if (!organizationId) return;

  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const drives = [
    // Upcoming approved drives (the two rows drawn on wireframe D-05).
    { en: "Drive - Univ.", ur: "ڈرائیو - یونیورسٹی", venue: "University Main Hall", area: "Gulshan-e-Iqbal", start: 3 * day, length: 5 * hour, groups: '{}' },
    { en: "Drive - Mosque", ur: "ڈرائیو - مسجد", venue: "Jamia Masjid Courtyard", area: "Saddar", start: 10 * day, length: 4 * hour, groups: '{"O-","O+"}' },
    // A drive that is under way now, so the completion form (O-03) can be tried straight away.
    { en: "Drive - Library", ur: "ڈرائیو - لائبریری", venue: "Central Library", area: "Clifton", start: -1 * hour, length: 7 * hour, groups: '{}' },
  ];
  for (const drive of drives) {
    const exists = await db.query("SELECT 1 FROM campaigns WHERE organization_id = $1 AND title_en = $2", [
      organizationId,
      drive.en,
    ]);
    if (exists.rows.length > 0) continue;
    const startsAt = new Date(Date.now() + drive.start);
    await db.query(
      `INSERT INTO campaigns
         (organization_id, title_en, title_ur, description_en, description_ur, starts_at, ends_at,
          venue, area, target_groups, contact_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], '+923001112223', 'approved')`,
      [
        organizationId,
        drive.en,
        drive.ur,
        "Walk-in blood donation. Please bring your CNIC and eat before you donate.",
        "براہِ کرم اپنا شناختی کارڈ ساتھ لائیں اور عطیہ سے پہلے کچھ کھا لیں۔",
        startsAt.toISOString(),
        new Date(startsAt.getTime() + drive.length).toISOString(),
        drive.venue,
        drive.area,
        drive.groups,
      ],
    );
    console.log(`  + campaign ${drive.en}`);
  }

  const donor = await db.query<{ id: string }>("SELECT id FROM donors WHERE mobile = '+923009876543' LIMIT 1");
  const donorId = donor.rows[0]?.id;
  if (!donorId) return;
  const has = await db.query("SELECT 1 FROM donation_history WHERE donor_id = $1 LIMIT 1", [donorId]);
  if (has.rows.length > 0) return;
  await db.query(
    `INSERT INTO donation_history (donor_id, donated_on, place, source, recorded_by_organization_id)
     VALUES ($1, DATE '2026-01-12', 'Aga Khan University Hospital', 'self_reported', NULL),
            ($1, DATE '2026-06-03', 'Community drive, Saddar', 'recorded_by_org', $2)`,
    [donorId, organizationId],
  );
  console.log("  + donor history (2 donations)");
}

async function main() {
  const db = await connect();
  try {
    console.log("Applying migrations…");
    const applied = await migrate(db);
    console.log(applied.length === 0 ? "  schema already up to date" : `  applied ${applied.join(", ")}`);

    console.log("Seeding…");
    await ensureAdmin(db);
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    for (const org of ORGANIZATIONS) {
      await ensureOrganization(db, org, passwordHash);
    }
    await ensureCampaign(db); //Member 2 Sprint 1: A-04 campaign review
    await ensureDonor(db, passwordHash);
    await ensureMember4Demo(db); //Member 4 Sprint 1: D-04..D-06, O-02, O-03
    await adminQueueNotification(db);

    console.log("");
    console.log("Demo accounts");
    console.log(`  Administrator : ${(process.env.ADMIN_EMAIL || "admin@wasl.pk")} / ${process.env.ADMIN_PASSWORD || "WaslAdmin#2026"}`);
    console.log(`  Hospital      : hospital@demo.wasl / ${DEMO_PASSWORD}`);
    console.log(`  Blood bank    : bank@demo.wasl / ${DEMO_PASSWORD}`);
    console.log(`  Blood bank 2  : bank2@demo.wasl / ${DEMO_PASSWORD}  (TEST bank, for 4.7 transfers)`);
    console.log(`  Organizer     : organizer@demo.wasl / ${DEMO_PASSWORD}`);
    console.log(`  Pending org   : pending@demo.wasl / ${DEMO_PASSWORD}   (stays on G-04)`);
    console.log(`  Rejected org  : rejected@demo.wasl / ${DEMO_PASSWORD}  (stays on G-04)`);
    console.log(`  Donor         : +923009876543 / ${DEMO_PASSWORD}`);
  } finally {
    await db.close();
  }
}

await main();

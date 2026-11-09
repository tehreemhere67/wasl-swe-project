import type { DictionaryPart } from "../types";

/**
 * Blood bank area labels (B-01..B-07) used by the Sprint 1 screen shells.
 *
 * Inventory and expiry/low-stock monitoring belong to Module 4 / Module 7
 * (Member 3) and are built in Sprint 1; the open-requests + offer screen is
 * Module REQ and is reserved for Sprint 2.
 */
export const bloodbank: DictionaryPart = {
  en: {
    // ---------------------------------------------------------------------
    // Shared ownership notice (B-01..B-07)
    // ---------------------------------------------------------------------
    "bloodbank.ph.wireframe": "Wireframe {id}",
    "bloodbank.ph.sprint1": "Sprint 1 — module owner builds this",
    "bloodbank.ph.sprint2": "Sprint 2",
    "bloodbank.owner.inventory": "Module 4 · Blood bank inventory",
    "bloodbank.owner.monitoring": "Module 7 · Expiry and availability monitoring",
    "bloodbank.owner.donations": "Module 3 · Donation history",
    "bloodbank.owner.requests": "Module REQ · Blood requests and offers",

    "bloodbank.ph.b01":
      "Bank home with the expiry and low-stock alerts, the four primary actions and the last-updated time.",
    "bloodbank.ph.b02":
      "Inventory list with group, component, units, status and expiry columns, plus the add-batch action.",
    "bloodbank.ph.b03":
      "Add or edit a batch with group, component, units, status, expiry and the inline expiry-date error.",
    "bloodbank.ph.b04":
      "Batch detail with the added, reserved and issued movements, who recorded them and when.",
    "bloodbank.ph.b05":
      "Settings for the low-stock threshold, expiry warning windows and SMS alerts.",
    "bloodbank.ph.b06":
      "Open requests that match this bank's stock, with the offer-units action and its reserve step.",
    "bloodbank.ph.b07":
      "Record that a donation took place for a donor phone number and a date.",

    // ---------------------------------------------------------------------
    // B-01 Dashboard + alerts
    // ---------------------------------------------------------------------
    "bank.alerts": "Alerts ({count})",
    "bank.alert.plateletExpiry": "Platelets A+ expire in 1 day",
    "bank.alert.lowStock": "Low stock: {units} units",
    "bank.lastUpdated": "Last updated {time}",

    // ---------------------------------------------------------------------
    // B-02 Inventory list
    // ---------------------------------------------------------------------
    "bank.expiry": "Expiry",
    "bank.status.approved": "Approved",
    "bank.status.awaiting": "Awaiting",
    "bank.date.12Nov": "12 Nov",
    "bank.date.14Oct": "14 Oct",

    // ---------------------------------------------------------------------
    // B-03 Add / edit batch
    // ---------------------------------------------------------------------
    "bank.batch.errorExpiry": "Enter a valid expiry date",

    // ---------------------------------------------------------------------
    // B-04 Batch detail + movements
    // ---------------------------------------------------------------------
    "bank.batch.title": "Batch {group} {component}",
    "bank.movement.added": "Added",
    "bank.movement.reserved": "Reserved",
    "bank.movement.issued": "Issued",
    "bank.movement.whoWhen": "Who · when",
    "bank.movement.row1Meta": "Blood bank staff · 12 Nov",
    "bank.movement.row2Meta": "Blood bank staff · 13 Nov",
    "bank.movement.row3Meta": "Blood bank staff · 14 Nov",
    "bank.batch.reserve": "Reserve",
    "bank.batch.issue": "Issue",
    "bank.batch.transfer": "Transfer",
    "bank.batch.correct": "Correct",

    // ---------------------------------------------------------------------
    // B-05 Settings
    // ---------------------------------------------------------------------
    "bank.settings.title": "Threshold and windows",
    "bank.settings.threshold": "Low-stock threshold per blood group (default 5)",
    "bank.settings.expiry":
      "Expiry warning: platelets 2 days · RBC 7 days · whole blood 7 days · plasma 30 days",
    "bank.settings.smsAlerts": "SMS alerts",

    // ---------------------------------------------------------------------
    // B-06 Open requests + offer
    // ---------------------------------------------------------------------
    "bank.openRequest.rowTitle": "#102 · O- red cells",
    "bank.openRequest.rowMeta": "2 units · Critical",
    "bank.sample.hospitalX": "Hospital X",
    "bank.openRequest.offer": "Offer units (+ reserve)",
    "bank.openRequest.matches": "Matches my stock",

    // ---------------------------------------------------------------------
    // B-07 Record donation
    // ---------------------------------------------------------------------
    "bank.record.donorPhone": "Donor phone",
    "bank.record.note": "Only that a donation took place",
  },
  ur: {
    "bloodbank.ph.wireframe": "وائرفریم {id}",
    "bloodbank.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "bloodbank.ph.sprint2": "سپرنٹ 2",
    "bloodbank.owner.inventory": "ماڈیول 4 · بلڈ بینک انوینٹری",
    "bloodbank.owner.monitoring": "ماڈیول 7 · میعاد اور دستیابی کی نگرانی",
    "bloodbank.owner.donations": "ماڈیول 3 · عطیے کی تاریخ",
    "bloodbank.owner.requests": "ماڈیول REQ · خون کی درخواستیں اور پیشکشیں",

    "bloodbank.ph.b01":
      "بلڈ بینک کا ہوم: میعاد اور کم ذخیرے کے انتباہات، چار بنیادی کارروائیاں اور آخری اپ ڈیٹ کا وقت۔",
    "bloodbank.ph.b02":
      "انوینٹری کی فہرست بلڈ گروپ، کمپوننٹ، یونٹس، حیثیت اور میعاد کے کالم کے ساتھ، اور بیچ شامل کرنے کی کارروائی۔",
    "bloodbank.ph.b03":
      "بیچ شامل کریں یا درست کریں: بلڈ گروپ، کمپوننٹ، یونٹس، حیثیت، میعاد اور تاریخ کی اندرونی غلطی۔",
    "bloodbank.ph.b04":
      "بیچ کی تفصیل: شامل، محفوظ اور جاری کی گئی حرکتیں، کس نے ریکارڈ کیں اور کب۔",
    "bloodbank.ph.b05":
      "کم ذخیرے کی حد، میعاد کی وارننگ کی زمانیں اور SMS انتباہات کی ترتیبات۔",
    "bloodbank.ph.b06":
      "اس بینک کے ذخیرے سے میل کھاتی کھلی درخواستیں، یونٹس پیش کرنے کی کارروائی اور محفوظ کرنے کا مرحلہ۔",
    "bloodbank.ph.b07":
      "کسی عطیہ دہندہ کے فون نمبر اور تاریخ کے لیے یہ ریکارڈ کرنا کہ عطیہ ہو چکا ہے۔",

    "bank.alerts": "انتباہات ({count})",
    "bank.alert.plateletExpiry": "پلیٹلیٹس A+ کی میعاد 1 دن میں ختم ہو رہی ہے",
    "bank.alert.lowStock": "کم ذخیرہ: {units} یونٹس",
    "bank.lastUpdated": "آخری اپ ڈیٹ {time}",

    "bank.expiry": "میعاد",
    "bank.status.approved": "منظور",
    "bank.status.awaiting": "زیرِ التوا",
    "bank.date.12Nov": "12 نومبر",
    "bank.date.14Oct": "14 اکتوبر",

    "bank.batch.errorExpiry": "درست میعاد کی تاریخ درج کریں",

    "bank.batch.title": "بیچ {group} {component}",
    "bank.movement.added": "شامل کیا",
    "bank.movement.reserved": "محفوظ کیا",
    "bank.movement.issued": "جاری کیا",
    "bank.movement.whoWhen": "کس نے · کب",
    "bank.movement.row1Meta": "بلڈ بینک عملہ · 12 نومبر",
    "bank.movement.row2Meta": "بلڈ بینک عملہ · 13 نومبر",
    "bank.movement.row3Meta": "بلڈ بینک عملہ · 14 نومبر",
    "bank.batch.reserve": "محفوظ کریں",
    "bank.batch.issue": "جاری کریں",
    "bank.batch.transfer": "منتقل کریں",
    "bank.batch.correct": "درست کریں",

    "bank.settings.title": "حد اور زمانیں",
    "bank.settings.threshold": "ہر بلڈ گروپ کے لیے کم ذخیرے کی حد (طے شدہ 5)",
    "bank.settings.expiry":
      "میعاد کی وارننگ: پلیٹلیٹس 2 دن · RBC 7 دن · مکمل خون 7 دن · پلازما 30 دن",
    "bank.settings.smsAlerts": "SMS انتباہات",

    "bank.openRequest.rowTitle": "#102 · O- سرخ خلیے",
    "bank.openRequest.rowMeta": "2 یونٹس · انتہائی فوری",
    "bank.sample.hospitalX": "ہسپتال X",
    "bank.openRequest.offer": "یونٹس پیش کریں (+ محفوظ کریں)",
    "bank.openRequest.matches": "میرے ذخیرے سے میل کھاتا ہے",

    "bank.record.donorPhone": "عطیہ دہندہ کا فون",
    "bank.record.note": "صرف یہ کہ عطیہ ہو چکا ہے",
  },
};

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

    // ---------------------------------------------------------------------
    // M4 inventory - B-02 list, B-03 add batch (Member 3)
    // ---------------------------------------------------------------------
    "inventory.title": "Inventory",
    "inventory.subtitle":
      "Every batch this blood bank holds, and how much of it is available to hospitals.",
    "inventory.addBatch": "Add batch",
    "inventory.back": "Back to inventory",
    "inventory.empty.title": "No batches yet",
    "inventory.empty.description":
      "Add the first batch so this blood bank starts reporting what it holds.",
    "inventory.col.group": "Blood group",
    "inventory.col.component": "Component",
    "inventory.col.available": "Available",
    "inventory.col.reserved": "Reserved",
    "inventory.col.status": "Status",
    "inventory.col.expiry": "Expiry",
    "inventory.col.batch": "Batch",
    "inventory.new.title": "Add batch",
    "inventory.new.subtitle": "Record a batch of blood this bank holds.",
    "inventory.field.expiry": "Expiry date",
    "inventory.field.expiryHint": "Date only; the batch expires at the end of that day.",
    "inventory.save": "Save batch",
    "inventory.saving": "Saving…",
    "inventory.select.group": "Choose a blood group",
    "inventory.select.component": "Choose a component",
    "inventory.select.status": "Choose a status",
    "inventory.status.awaiting": "Awaiting testing",
    "inventory.status.approved": "Approved",
    "inventory.status.rejected": "Rejected",
    "inventory.error.bloodGroup": "Choose a blood group.",
    "inventory.error.component": "Choose a component.",
    "inventory.error.units": "Enter a whole number of units, zero or more.",
    "inventory.error.status": "Choose a testing status.",
    "inventory.error.expiryInvalid": "Enter a valid expiry date.",
    "inventory.error.expiryPast": "The expiry date must be in the future.",
    "inventory.error.generic": "Something went wrong. Please try again.",

    // --- 4.3 batch detail + edit -----------------------------------------
    "inventory.detail.edit": "Edit batch",
    "inventory.detail.movements": "Movement history",
    "inventory.detail.noMovements": "No changes recorded yet.",
    "inventory.detail.unitsHeld": "Units held",
    "inventory.detail.addedBy": "Added by",
    "inventory.detail.addedOn": "Added on",
    "inventory.edit.title": "Edit batch",
    "inventory.edit.subtitle":
      "Correct this batch. Every change is recorded in its movement history.",
    "inventory.saveChanges": "Save changes",
    "inventory.backToBatch": "Back to batch",
    "inventory.movement.added": "Added",
    "inventory.movement.reserved": "Reserved",
    "inventory.movement.reservation_released": "Reservation released",
    "inventory.movement.issued": "Issued",
    "inventory.movement.transferred_out": "Transferred out",
    "inventory.movement.expired": "Expired",
    "inventory.movement.discarded": "Discarded",
    "inventory.movement.correction": "Correction",
    "inventory.movement.statusChanged": "Status: {from} → {to}",

    // --- 4.4 issue / discard / expire / correct ---------------------------
    "inventory.action.title": "Record a change",
    "inventory.action.issue": "Issue units",
    "inventory.action.discard": "Discard units",
    "inventory.action.expire": "Mark expired",
    "inventory.action.correct": "Correct quantity",
    "inventory.action.note": "Note (optional)",
    "inventory.action.reason": "Reason",
    "inventory.action.confirm": "Confirm",
    "inventory.action.cancel": "Cancel",
    "inventory.action.working": "Saving…",
    "inventory.action.issueHint": "Units leaving the bank for a hospital.",
    "inventory.action.discardHint": "Units that were wasted or unusable.",
    "inventory.action.expireWarning": "This marks all {units} remaining units as expired.",
    "inventory.action.correctHint": "Enter the correct total quantity this batch holds.",
    "inventory.error.unitsTooMany": "You cannot remove more units than the batch holds.",
    "inventory.error.reason": "Enter a short reason.",
    "inventory.error.nothingToExpire": "This batch has no units left to expire.",
    "inventory.error.movementType": "Choose an action.",

    // --- 4.6 reservations --------------------------------------------------
    "inventory.reserve.title": "Reservations",
    "inventory.reserve.action": "Reserve units",
    "inventory.reserve.units": "Units",
    "inventory.reserve.holdHours": "Hold (hours)",
    "inventory.reserve.until": "{units} units · held until {time}",
    "inventory.reserve.release": "Release",
    "inventory.reserve.none": "No units are reserved.",
    "inventory.reserve.working": "Working…",
    "inventory.error.reserveTooMany": "You cannot reserve more units than are free.",
    "inventory.error.holdHours": "Enter a hold period between 1 and 72 hours.",

    // --- 4.7 transfers -----------------------------------------------------
    "inventory.action.transfer": "Transfer out",
    "inventory.action.transferHint":
      "Units sent to another verified blood bank. That bank records its own incoming batch; Wasl does not move stock itself.",
    "inventory.field.receivingBank": "Receiving blood bank",
    "inventory.select.receivingBank": "Choose a blood bank",
    "inventory.transfer.none": "No other verified blood bank is available yet.",
    "inventory.error.receivingBank": "Choose a receiving blood bank.",
    "inventory.movement.transferredTo": "To {bank}",

    // --- 7.1 / 7.2 alerts --------------------------------------------------
    "inventory.alert.expiryTitle": "Expiry warning: {group} {component}",
    "inventory.alert.expiryBody": "{units} units expire on {date}.",
    "inventory.alert.lowStockTitle": "Low stock: {group} {component}",
    "inventory.alert.lowStockBody": "Only {units} units left.",
    "inventory.alert.none": "No alerts. Stock is healthy.",

    // --- 4.4 soft delete ---------------------------------------------------
    "inventory.archive.action": "Remove from list",
    "inventory.archive.hint":
      "This batch holds no units. Removing it hides it from the list; its movement history is kept.",
    "inventory.archive.working": "Removing…",
    "inventory.archive.notice": "Removed from the list on {date}. Its history is kept.",
    "inventory.archive.error": "The batch could not be removed.",
    "inventory.error.batchNotEmpty": "Remove the remaining units first.",

    // --- 7.4 alert actions -------------------------------------------------
    "inventory.alert.openBatch": "Open batch",
    "inventory.alert.acknowledge": "Acknowledge",

    // --- B-05 settings (7.1 / 7.3) ----------------------------------------
    "inventory.settings.title": "Threshold and windows",
    "inventory.settings.thresholdNote":
      "Low-stock threshold for each blood group and component. Leave a box empty to use the default of 5.",
    "inventory.settings.windowsTitle": "Expiry warning windows (days)",
    "inventory.settings.windowsNote":
      "How many days before expiry each component starts warning.",
    "inventory.settings.sms": "Send SMS alerts (when the messaging provider is configured)",
    "inventory.settings.save": "Save settings",
    "inventory.settings.saving": "Saving…",
    "inventory.settings.saved": "Settings saved.",
    "inventory.error.threshold": "Enter a whole number of units, zero or more.",
    "inventory.error.warningDays": "Enter a whole number of days between 0 and 365.",
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

    // M4 inventory - B-02 list, B-03 add batch (Member 3)
    "inventory.title": "انوینٹری",
    "inventory.subtitle":
      "اس بلڈ بینک کے پاس موجود ہر بیچ، اور ہسپتالوں کے لیے کتنی مقدار دستیاب ہے۔",
    "inventory.addBatch": "بیچ شامل کریں",
    "inventory.back": "انوینٹری پر واپس",
    "inventory.empty.title": "ابھی کوئی بیچ نہیں",
    "inventory.empty.description":
      "پہلا بیچ شامل کریں تاکہ یہ بلڈ بینک اپنا ذخیرہ بتانا شروع کرے۔",
    "inventory.col.group": "بلڈ گروپ",
    "inventory.col.component": "کمپوننٹ",
    "inventory.col.available": "دستیاب",
    "inventory.col.reserved": "محفوظ",
    "inventory.col.status": "حیثیت",
    "inventory.col.expiry": "میعاد",
    "inventory.col.batch": "بیچ",
    "inventory.new.title": "بیچ شامل کریں",
    "inventory.new.subtitle": "اس بینک کے پاس موجود خون کا ایک بیچ ریکارڈ کریں۔",
    "inventory.field.expiry": "میعاد کی تاریخ",
    "inventory.field.expiryHint": "صرف تاریخ درج کریں؛ بیچ اسی دن کے آخر میں ختم ہوگا۔",
    "inventory.save": "بیچ محفوظ کریں",
    "inventory.saving": "محفوظ ہو رہا ہے…",
    "inventory.select.group": "بلڈ گروپ منتخب کریں",
    "inventory.select.component": "کمپوننٹ منتخب کریں",
    "inventory.select.status": "حیثیت منتخب کریں",
    "inventory.status.awaiting": "زیرِ جانچ",
    "inventory.status.approved": "منظور",
    "inventory.status.rejected": "مسترد",
    "inventory.error.bloodGroup": "بلڈ گروپ منتخب کریں۔",
    "inventory.error.component": "کمپوننٹ منتخب کریں۔",
    "inventory.error.units": "یونٹس کی مکمل تعداد درج کریں، صفر یا اس سے زیادہ۔",
    "inventory.error.status": "جانچ کی حیثیت منتخب کریں۔",
    "inventory.error.expiryInvalid": "درست میعاد کی تاریخ درج کریں۔",
    "inventory.error.expiryPast": "میعاد کی تاریخ آئندہ کی ہونی چاہیے۔",
    "inventory.error.generic": "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔",

    "inventory.detail.edit": "بیچ میں ترمیم کریں",
    "inventory.detail.movements": "حرکات کی تاریخ",
    "inventory.detail.noMovements": "ابھی کوئی تبدیلی ریکارڈ نہیں ہوئی۔",
    "inventory.detail.unitsHeld": "موجود یونٹس",
    "inventory.detail.addedBy": "شامل کرنے والا",
    "inventory.detail.addedOn": "شامل کرنے کی تاریخ",
    "inventory.edit.title": "بیچ میں ترمیم کریں",
    "inventory.edit.subtitle":
      "اس بیچ کو درست کریں۔ ہر تبدیلی حرکات کی تاریخ میں ریکارڈ ہوتی ہے۔",
    "inventory.saveChanges": "تبدیلیاں محفوظ کریں",
    "inventory.backToBatch": "بیچ پر واپس",
    "inventory.movement.added": "شامل کیا",
    "inventory.movement.reserved": "محفوظ کیا",
    "inventory.movement.reservation_released": "محفوظ کرنا ختم کیا",
    "inventory.movement.issued": "جاری کیا",
    "inventory.movement.transferred_out": "منتقل کیا",
    "inventory.movement.expired": "میعاد ختم",
    "inventory.movement.discarded": "رد کیا",
    "inventory.movement.correction": "درستی",
    "inventory.movement.statusChanged": "حیثیت: {from} → {to}",

    "inventory.action.title": "تبدیلی ریکارڈ کریں",
    "inventory.action.issue": "یونٹس جاری کریں",
    "inventory.action.discard": "یونٹس رد کریں",
    "inventory.action.expire": "میعاد ختم کریں",
    "inventory.action.correct": "تعداد درست کریں",
    "inventory.action.note": "نوٹ (اختیاری)",
    "inventory.action.reason": "وجہ",
    "inventory.action.confirm": "تصدیق کریں",
    "inventory.action.cancel": "منسوخ کریں",
    "inventory.action.working": "محفوظ ہو رہا ہے…",
    "inventory.action.issueHint": "وہ یونٹس جو ہسپتال کے لیے بینک سے جا رہے ہیں۔",
    "inventory.action.discardHint": "وہ یونٹس جو ضائع ہو گئے یا قابلِ استعمال نہیں رہے۔",
    "inventory.action.expireWarning": "اس سے باقی {units} یونٹس میعاد ختم شدہ ہو جائیں گے۔",
    "inventory.action.correctHint": "اس بیچ کی صحیح کل تعداد درج کریں۔",
    "inventory.error.unitsTooMany": "بیچ میں موجود یونٹس سے زیادہ نہیں نکال سکتے۔",
    "inventory.error.reason": "مختصر وجہ درج کریں۔",
    "inventory.error.nothingToExpire": "اس بیچ میں میعاد ختم کرنے کے لیے کوئی یونٹ نہیں۔",
    "inventory.error.movementType": "کوئی کارروائی منتخب کریں۔",

    "inventory.reserve.title": "محفوظ یونٹس",
    "inventory.reserve.action": "یونٹس محفوظ کریں",
    "inventory.reserve.units": "یونٹس",
    "inventory.reserve.holdHours": "محفوظ مدت (گھنٹے)",
    "inventory.reserve.until": "{units} یونٹس · {time} تک محفوظ",
    "inventory.reserve.release": "محفوظ کرنا ختم کریں",
    "inventory.reserve.none": "کوئی یونٹ محفوظ نہیں ہیں۔",
    "inventory.reserve.working": "کام جاری ہے…",
    "inventory.error.reserveTooMany": "دستیاب یونٹس سے زیادہ محفوظ نہیں کر سکتے۔",
    "inventory.error.holdHours": "محفوظ مدت 1 سے 72 گھنٹے کے درمیان درج کریں۔",

    "inventory.action.transfer": "منتقل کریں",
    "inventory.action.transferHint":
      "دوسرے تصدیق شدہ بلڈ بینک کو بھیجے گئے یونٹس۔ وہ بینک اپنا آنے والا بیچ خود ریکارڈ کرتا ہے؛ واصل خود اسٹاک منتقل نہیں کرتا۔",
    "inventory.field.receivingBank": "وصول کرنے والا بلڈ بینک",
    "inventory.select.receivingBank": "بلڈ بینک منتخب کریں",
    "inventory.transfer.none": "ابھی کوئی دوسرا تصدیق شدہ بلڈ بینک دستیاب نہیں۔",
    "inventory.error.receivingBank": "وصول کرنے والا بلڈ بینک منتخب کریں۔",
    "inventory.movement.transferredTo": "{bank} کو",

    "inventory.alert.expiryTitle": "میعاد کا انتباہ: {group} {component}",
    "inventory.alert.expiryBody": "{units} یونٹس کی میعاد {date} کو ختم ہو رہی ہے۔",
    "inventory.alert.lowStockTitle": "کم ذخیرہ: {group} {component}",
    "inventory.alert.lowStockBody": "صرف {units} یونٹس باقی ہیں۔",
    "inventory.alert.none": "کوئی انتباہ نہیں۔ ذخیرہ مناسب ہے۔",

    "inventory.archive.action": "فہرست سے ہٹائیں",
    "inventory.archive.hint":
      "اس بیچ میں کوئی یونٹ باقی نہیں۔ ہٹانے سے یہ فہرست سے غائب ہو جائے گا؛ اس کی حرکات کی تاریخ محفوظ رہے گی۔",
    "inventory.archive.working": "ہٹایا جا رہا ہے…",
    "inventory.archive.notice": "{date} کو فہرست سے ہٹایا گیا۔ اس کی تاریخ محفوظ ہے۔",
    "inventory.archive.error": "بیچ ہٹایا نہیں جا سکا۔",
    "inventory.error.batchNotEmpty": "پہلے باقی یونٹس نکالیں۔",

    "inventory.alert.openBatch": "بیچ کھولیں",
    "inventory.alert.acknowledge": "تسلیم کریں",

    "inventory.settings.title": "حد اور زمانیں",
    "inventory.settings.thresholdNote":
      "ہر بلڈ گروپ اور کمپوننٹ کے لیے کم ذخیرے کی حد۔ طے شدہ 5 استعمال کرنے کے لیے خانہ خالی چھوڑیں۔",
    "inventory.settings.windowsTitle": "میعاد کی وارننگ کی زمانیں (دن)",
    "inventory.settings.windowsNote": "میعاد ختم ہونے سے کتنے دن پہلے وارننگ شروع ہو۔",
    "inventory.settings.sms": "SMS انتباہات بھیجیں (جب پیغام رسانی کی سہولت دستیاب ہو)",
    "inventory.settings.save": "ترتیبات محفوظ کریں",
    "inventory.settings.saving": "محفوظ ہو رہا ہے…",
    "inventory.settings.saved": "ترتیبات محفوظ ہو گئیں۔",
    "inventory.error.threshold": "یونٹس کی مکمل تعداد درج کریں، صفر یا اس سے زیادہ۔",
    "inventory.error.warningDays": "دنوں کی مکمل تعداد 0 سے 365 کے درمیان درج کریں۔",
  },
};

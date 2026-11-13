import type { DictionaryPart } from "../types";

/**
 * Administrator area labels (A-01, A-03..A-08) used by the Sprint 1 screen
 * shells. A-02 (verify organizations) is owned by Member 1 and is a real
 * screen, so it is not described here.
 *
 * Account management and campaign review belong to Module 8 (Member 2) and are
 * built in Sprint 1; the consolidated inventory dashboard, flags, audit log,
 * reports and settings are reserved for Sprint 2.
 */
export const admin: DictionaryPart = {
  en: {
    // ---------------------------------------------------------------------
    // Shared ownership notice (A-01, A-03..A-08)
    // ---------------------------------------------------------------------
    "admin.ph.wireframe": "Wireframe {id}",
    "admin.ph.sprint1": "Sprint 1 — module owner builds this",
    "admin.ph.sprint2": "Sprint 2",
    "admin.owner.admin": "Module 8 · Administration and reporting",

    "admin.ph.a01":
      "Consolidated inventory across all banks with group, component, available and expiring columns; a row drills down to the bank.",
    "admin.ph.a03":
      "Account search with the account type and status, and the deactivate / reactivate actions.",
    "admin.ph.a04":
      "Campaign review queue with the campaign details and the approve, reject-with-reason and return-for-change actions.",
    "admin.ph.a05":
      "The flags queue with the flagged request and reason, hide/cancel with a reason, dismiss, and the organization notification.",
    "admin.ph.a06":
      "Audit log with time, user, action and details, and the filter box.",
    "admin.ph.a07":
      "Reports with the date range, the requests / donation activity / inventory tabs and the aggregate-only privacy note.",
    "admin.ph.a08":
      "Platform settings: compatibility table, matching distances and weights, hold period and escalation timings, and Karachi areas.",

    // ---------------------------------------------------------------------
    // A-01 Inventory dashboard
    // ---------------------------------------------------------------------
    "admin.inventory.title": "Inventory — all banks",
    "admin.inventory.available": "Available",
    "admin.inventory.expiring": "Expiring",
    "admin.inventory.drilldown": "Click a row to open the bank drill down.",

    // ---------------------------------------------------------------------
    // A-03 Account management
    // ---------------------------------------------------------------------
    "admin.accounts.title": "Accounts",
    "admin.accounts.row": "Donor/org · Status",
    "admin.accounts.deactivate": "Deactivate",
    "admin.accounts.reactivate": "Reactivate",

    // ---------------------------------------------------------------------
    // A-04 Campaign review
    // ---------------------------------------------------------------------
    "admin.campaignReview.title": "Pending campaigns",
    "admin.campaignReview.details": "Campaign details",
    "admin.campaignReview.detailsHint": "The selected campaign's details appear here.",
    "admin.campaignReview.approve": "Approve",
    "admin.campaignReview.reject": "Reject + reason",
    "admin.campaignReview.return": "Return for change",

    // ---------------------------------------------------------------------
    // A-05 Flags + hide content
    // ---------------------------------------------------------------------
    "admin.flags.title": "Flags queue",
    "admin.flags.row": "Request #102 · reason",
    "admin.flags.hide": "Hide/cancel + reason",
    "admin.flags.notified": "Organization is notified.",

    // ---------------------------------------------------------------------
    // A-06 Audit log
    // ---------------------------------------------------------------------
    "admin.audit.title": "Audit log",
    "admin.audit.time": "Time",
    "admin.audit.user": "User",
    "admin.audit.action": "Action",
    "admin.audit.details": "Details",
    "admin.audit.filter": "Filter",
    "admin.audit.row1": "12 Nov 09:14 · Wasl team · Approve organization · Hospital Z",
    "admin.audit.row2": "12 Nov 10:02 · Hospital X · Create request · #102",
    "admin.audit.row3": "12 Nov 11:20 · Blood bank A · Add batch · O- red cells",

    // ---------------------------------------------------------------------
    // A-07 Reports
    // ---------------------------------------------------------------------
    "admin.reports.title": "Reports",
    "admin.reports.dateRange": "Date range",
    "admin.reports.tabRequests": "Requests",
    "admin.reports.tabDonations": "Donation activity",
    "admin.reports.tabInventory": "Inventory",
    "admin.reports.summary": "Counts by status / urgency / hospital · average time",
    "admin.reports.privacy": "Aggregate only — no donor names or phones",

    // ---------------------------------------------------------------------
    // A-08 Settings + areas
    // ---------------------------------------------------------------------
    "admin.settings.compatibility": "Compatibility table",
    "admin.settings.distances": "Distances 30/15 km · weights 60/40",
    "admin.settings.hold": "Hold period · escalation timings",
    "admin.settings.areas": "Karachi area (English / Urdu)",

    // ---------------------------------------------------------------------
    // A-03 Account management (Member 2, Sprint 1)
    // ---------------------------------------------------------------------
    "admin.accounts.subtitle":
      "Search every account on the platform. Deactivating an account signs it out and blocks its next login.",
    "admin.accounts.searchPlaceholder": "Search by name, email, phone or organization",
    "admin.accounts.filterAll": "All",
    "admin.accounts.filterOrgs": "Organizations",
    "admin.accounts.filterDonors": "Donors",
    "admin.accounts.count": "{count} accounts",
    "admin.accounts.joined": "Joined {when}",
    "admin.accounts.empty": "No account matches this search.",
    "admin.accounts.you": "This is your own account",
    "admin.accounts.updated": "Account updated.",
    "admin.accounts.selfBlocked": "You cannot deactivate your own account.",
    "admin.accounts.lastAdmin": "The last active administrator cannot be deactivated.",

    // ---------------------------------------------------------------------
    // A-04 Campaign review (Member 2, Sprint 1)
    // ---------------------------------------------------------------------
    "admin.campaignReview.subtitle":
      "Review campaigns submitted by verified organizers before they are shown to donors.",
    "admin.campaignReview.queue": "Pending approval",
    "admin.campaignReview.empty": "No campaign is waiting for review.",
    "admin.campaignReview.organizer": "Organizer",
    "admin.campaignReview.submitted": "Submitted {when}",
    "admin.campaignReview.starts": "Starts",
    "admin.campaignReview.ends": "Ends",
    "admin.campaignReview.venue": "Venue",
    "admin.campaignReview.area": "Area",
    "admin.campaignReview.groups": "Target groups",
    "admin.campaignReview.reasonPlaceholder": "Reason (required to reject or return)",
    "admin.campaignReview.reasonRequired": "Give a reason of at least 3 characters.",
    "admin.campaignReview.reviewed": "Decision recorded and the organizer notified.",
    "admin.campaignReview.notified": "The organizer is notified in the platform in both languages.",
    "admin.campaignReview.notPending": "This campaign has already been reviewed.",
    "admin.campaignReview.waitingDays": "{days} days",
    "admin.campaignReview.waitingHours": "{hours} h",
    "admin.campaignReview.statusDraft": "Draft",
    "admin.campaignReview.statusPendingApproval": "Pending approval",
    "admin.campaignReview.statusApproved": "Approved",
    "admin.campaignReview.statusRejected": "Rejected",
    "admin.campaignReview.statusCancelled": "Cancelled",
    "admin.campaignReview.statusCompleted": "Completed",

    // ---------------------------------------------------------------------
    // A-02 queue search (Member 2, Sprint 1)
    // ---------------------------------------------------------------------
    "admin.verify.searchPlaceholder": "Search by name, licence or representative",
    "admin.verify.filterType": "Organization type",
    "admin.verify.allTypes": "All types",
  },

  ur: {
    "admin.ph.wireframe": "وائرفریم {id}",
    "admin.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "admin.ph.sprint2": "سپرنٹ 2",
    "admin.owner.admin": "ماڈیول 8 · انتظامیہ اور رپورٹنگ",

    "admin.ph.a01":
      "تمام بلڈ بینکوں کی مجموعی انوینٹری بلڈ گروپ، کمپوننٹ، دستیاب اور میعاد ختم ہونے والے کالمز کے ساتھ؛ قطار پر کلک کرنے سے بینک کی تفصیل کھلتی ہے۔",
    "admin.ph.a03":
      "اکاؤنٹ کی تلاش اکاؤنٹ کی قسم اور حیثیت کے ساتھ، اور غیر فعال / دوبارہ فعال کرنے کی کارروائیاں۔",
    "admin.ph.a04":
      "مہموں کے جائزے کی قطار مہم کی تفصیلات اور منظور، وجہ کے ساتھ مسترد اور ترمیم کے لیے واپس کرنے کی کارروائیوں کے ساتھ۔",
    "admin.ph.a05":
      "شکایات کی قطار جھنڈا لگی درخواست اور وجہ کے ساتھ، وجہ کے ساتھ چھپائیں/منسوخ کریں، برخاست کریں، اور تنظیم کو اطلاع۔",
    "admin.ph.a06": "آڈٹ لاگ وقت، صارف، کارروائی اور تفصیلات کے ساتھ، اور فلٹر خانہ۔",
    "admin.ph.a07":
      "رپورٹس تاریخ کی حد، درخواستیں / عطیے کی کارروائی / انوینٹری ٹیبز اور صرف مجموعی رازداری کے نوٹس کے ساتھ۔",
    "admin.ph.a08":
      "پلیٹ فارم کی ترتیبات: مطابقت کی جدول، فاصلے اور وزن، ہولڈ کی مدت اور ایسکلیشن کے اوقات، اور کراچی کے علاقے۔",

    "admin.inventory.title": "انوینٹری — تمام بلڈ بینک",
    "admin.inventory.available": "دستیاب",
    "admin.inventory.expiring": "میعاد ختم ہونے والے",
    "admin.inventory.drilldown": "بینک کی تفصیل کھولنے کے لیے کسی قطار پر کلک کریں۔",

    "admin.accounts.title": "اکاؤنٹس",
    "admin.accounts.row": "عطیہ دہندہ/تنظیم · حیثیت",
    "admin.accounts.deactivate": "غیر فعال کریں",
    "admin.accounts.reactivate": "دوبارہ فعال کریں",

    "admin.campaignReview.title": "زیرِ التوا مہمیں",
    "admin.campaignReview.details": "مہم کی تفصیلات",
    "admin.campaignReview.detailsHint": "منتخب مہم کی تفصیلات یہاں دکھائی جائیں گی۔",
    "admin.campaignReview.approve": "منظور کریں",
    "admin.campaignReview.reject": "مسترد + وجہ",
    "admin.campaignReview.return": "ترمیم کے لیے واپس کریں",

    "admin.flags.title": "شکایات کی قطار",
    "admin.flags.row": "درخواست #102 · وجہ",
    "admin.flags.hide": "چھپائیں/منسوخ کریں + وجہ",
    "admin.flags.notified": "تنظیم کو اطلاع دی جاتی ہے۔",

    "admin.audit.title": "آڈٹ لاگ",
    "admin.audit.time": "وقت",
    "admin.audit.user": "صارف",
    "admin.audit.action": "کارروائی",
    "admin.audit.details": "تفصیلات",
    "admin.audit.filter": "فلٹر",
    "admin.audit.row1": "12 نومبر 09:14 · واصل ٹیم · تنظیم منظور · ہسپتال Z",
    "admin.audit.row2": "12 نومبر 10:02 · ہسپتال X · درخواست بنائی · #102",
    "admin.audit.row3": "12 نومبر 11:20 · بلڈ بینک اے · بیچ شامل کیا · O- سرخ خلیے",

    "admin.reports.title": "رپورٹس",
    "admin.reports.dateRange": "تاریخ کی حد",
    "admin.reports.tabRequests": "درخواستیں",
    "admin.reports.tabDonations": "عطیے کی کارروائی",
    "admin.reports.tabInventory": "انوینٹری",
    "admin.reports.summary": "حیثیت / فوریت / ہسپتال کے لحاظ سے گنتی · اوسط وقت",
    "admin.reports.privacy": "صرف مجموعی — عطیہ دہندگان کے نام یا فون نہیں",

    "admin.settings.compatibility": "مطابقت کی جدول",
    "admin.settings.distances": "فاصلے 30/15 کلومیٹر · وزن 60/40",
    "admin.settings.hold": "ہولڈ کی مدت · ایسکلیشن کے اوقات",
    "admin.settings.areas": "کراچی کا علاقہ (انگریزی / اردو)",
    
    "admin.accounts.subtitle":
      "پلیٹ فارم کے تمام اکاؤنٹس تلاش کریں۔ اکاؤنٹ غیر فعال کرنے سے وہ سائن آؤٹ ہو جاتا ہے اور اگلا لاگ ان بلاک ہو جاتا ہے۔",
    "admin.accounts.searchPlaceholder": "نام، ای میل، فون یا تنظیم سے تلاش کریں",
    "admin.accounts.filterAll": "تمام",
    "admin.accounts.filterOrgs": "تنظیمیں",
    "admin.accounts.filterDonors": "عطیہ دہندگان",
    "admin.accounts.count": "{count} اکاؤنٹس",
    "admin.accounts.joined": "شمولیت {when}",
    "admin.accounts.empty": "اس تلاش سے کوئی اکاؤنٹ نہیں ملا۔",
    "admin.accounts.you": "یہ آپ کا اپنا اکاؤنٹ ہے",
    "admin.accounts.updated": "اکاؤنٹ اپ ڈیٹ ہو گیا۔",
    "admin.accounts.selfBlocked": "آپ اپنا اکاؤنٹ غیر فعال نہیں کر سکتے۔",
    "admin.accounts.lastAdmin": "آخری فعال منتظم کو غیر فعال نہیں کیا جا سکتا۔",

    "admin.campaignReview.subtitle":
      "عطیہ دہندگان کو دکھانے سے پہلے تصدیق شدہ منتظمین کی جمع کردہ مہموں کا جائزہ لیں۔",
    "admin.campaignReview.queue": "منظوری کے منتظر",
    "admin.campaignReview.empty": "کوئی مہم جائزے کے انتظار میں نہیں۔",
    "admin.campaignReview.organizer": "منتظم",
    "admin.campaignReview.submitted": "جمع کردہ {when}",
    "admin.campaignReview.starts": "آغاز",
    "admin.campaignReview.ends": "اختتام",
    "admin.campaignReview.venue": "مقام",
    "admin.campaignReview.area": "علاقہ",
    "admin.campaignReview.groups": "ہدف گروپس",
    "admin.campaignReview.reasonPlaceholder": "وجہ (مسترد کرنے یا واپس کرنے کے لیے لازمی)",
    "admin.campaignReview.reasonRequired": "کم از کم 3 حروف کی وجہ درج کریں۔",
    "admin.campaignReview.reviewed": "فیصلہ ریکارڈ ہو گیا اور منتظم کو اطلاع دے دی گئی۔",
    "admin.campaignReview.notified": "منتظم کو پلیٹ فارم پر دونوں زبانوں میں اطلاع دی جاتی ہے۔",
    "admin.campaignReview.notPending": "اس مہم کا جائزہ پہلے ہی لیا جا چکا ہے۔",
    "admin.campaignReview.waitingDays": "{days} دن",
    "admin.campaignReview.waitingHours": "{hours} گھنٹے",
    "admin.campaignReview.statusDraft": "ڈرافٹ",
    "admin.campaignReview.statusPendingApproval": "منظوری کے منتظر",
    "admin.campaignReview.statusApproved": "منظور",
    "admin.campaignReview.statusRejected": "مسترد",
    "admin.campaignReview.statusCancelled": "منسوخ",
    "admin.campaignReview.statusCompleted": "مکمل",

    "admin.verify.searchPlaceholder": "نام، لائسنس یا نمائندے سے تلاش کریں",
    "admin.verify.filterType": "تنظیم کی قسم",
    "admin.verify.allTypes": "تمام اقسام",
  },
};

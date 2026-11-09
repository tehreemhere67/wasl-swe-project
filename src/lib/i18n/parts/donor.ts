import type { DictionaryPart } from "../types";

/**
 * Donor area labels (D-01..D-06) used by the Sprint 1 screen shells.
 *
 * Donor profiles, donation history and campaign browsing belong to Module 3 /
 * Module 6 (Member 4) and are built in Sprint 1; matching, responding to
 * requests and notifications are reserved for Sprint 2.
 */
export const donor: DictionaryPart = {
  en: {
    // ---------------------------------------------------------------------
    // Shared ownership notice (D-01..D-06)
    // ---------------------------------------------------------------------
    "donor.ph.wireframe": "Wireframe {id}",
    "donor.ph.sprint1": "Sprint 1 — module owner builds this",
    "donor.ph.sprint2": "Sprint 2",
    "donor.owner.requests": "Module 3 · Donor matching and responses",
    "donor.owner.profile": "Module 3 · Donor profile and preferences",
    "donor.owner.history": "Module 3 · Donation history",
    "donor.owner.campaigns": "Module 6 · Donation campaigns",

    "donor.ph.d01":
      "Donor home with the availability toggle, the two nearest matching requests, campaigns and the profile/history links.",
    "donor.ph.d02":
      "A request with its summary, the eligibility notice and the willing/decline response buttons.",
    "donor.ph.d03":
      "Donor profile: blood group, area, notification channels, notice preferences and language.",
    "donor.ph.d04":
      "Donation history with the self-reported and organization-recorded entries, add-past-donation and the reminder interval.",
    "donor.ph.d05":
      "Campaign browse with the area, date and blood-group filters and the verified campaign cards.",
    "donor.ph.d06":
      "Campaign detail with the title/date/venue/target line, the verified organizer and the attend action.",

    // ---------------------------------------------------------------------
    // D-01 Home
    // ---------------------------------------------------------------------
    "donor.home.available": "Available",
    "donor.home.row102": "O- · Critical · Hospital X · 2 km",
    "donor.home.row101": "O- · Urgent · Hospital Y · 9 km",

    // ---------------------------------------------------------------------
    // D-02 Request detail + respond
    // ---------------------------------------------------------------------
    "donor.request.title": "Request #{id}",
    "donor.request.summary": "O- red cells · 2 units · Hospital X by 6pm",
    "donor.request.willing": "I'm willing",
    "donor.request.decline": "Decline",

    // ---------------------------------------------------------------------
    // D-03 Profile
    // ---------------------------------------------------------------------
    "donor.profile.areaPlaceholder": "Karachi",
    "donor.profile.channels": "Notification channels",
    "donor.channel.sms": "SMS",
    "donor.channel.whatsapp": "WhatsApp",
    "donor.channel.platform": "Platform",
    "donor.profile.preferences": "Notify me about",
    "donor.pref.urgent": "Urgent",
    "donor.pref.campaignNotices": "Campaign notices",
    "donor.profile.deleteAccount": "Delete account",

    // ---------------------------------------------------------------------
    // D-04 History + reminder
    // ---------------------------------------------------------------------
    "donor.history.title": "Donations (total {count})",
    "donor.history.selfReported": "12 Jan · Self reported",
    "donor.history.recordedByOrg": "03 June · Recorded by org",
    "donor.history.addPast": "Add past donation",
    "donor.history.remindBefore": "Remind me after",
    "donor.history.remindAfter": "days",

    // ---------------------------------------------------------------------
    // D-05 Campaigns browse
    // ---------------------------------------------------------------------
    "donor.campaigns.filterGroup": "Group",
    "donor.campaigns.driveUniv": "Drive - Univ.",
    "donor.campaigns.driveMosque": "Drive - Mosque",
    "donor.campaigns.date20Nov": "20 Nov",
    "donor.campaigns.date27Nov": "27 Nov",

    // ---------------------------------------------------------------------
    // D-06 Campaign detail
    // ---------------------------------------------------------------------
    "donor.campaign.title": "Campaign",
    "donor.campaign.meta": "Title · date · venue · target",
    "donor.campaign.organizer": "Organizer",
    "donor.campaign.attend": "I plan to attend",
  },
  ur: {
    "donor.ph.wireframe": "وائرفریم {id}",
    "donor.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "donor.ph.sprint2": "سپرنٹ 2",
    "donor.owner.requests": "ماڈیول 3 · عطیہ دہندہ کی مطابقت اور جوابات",
    "donor.owner.profile": "ماڈیول 3 · عطیہ دہندہ کا پروفائل اور ترجیحات",
    "donor.owner.history": "ماڈیول 3 · عطیے کی تاریخ",
    "donor.owner.campaigns": "ماڈیول 6 · عطیے کی مہمیں",

    "donor.ph.d01":
      "عطیہ دہندہ کا ہوم: دستیابی کا ٹوگل، قریب ترین دو درخواستیں، مہمیں اور پروفائل/تاریخ کے لنک۔",
    "donor.ph.d02":
      "ایک درخواست اس کے خلاصے، اہلیت کے نوٹس اور رضامندی/انکار کے بٹنوں کے ساتھ۔",
    "donor.ph.d03":
      "عطیہ دہندہ کا پروفائل: بلڈ گروپ، علاقہ، اطلاع کے ذرائع، اطلاعات کی ترجیحات اور زبان۔",
    "donor.ph.d04":
      "عطیوں کی تاریخ خود رپورٹ اور تنظیم کے ریکارڈ کے اندراجات کے ساتھ، پچھلا عطیہ شامل کرنے اور یاد دہانی کے وقفے کے ساتھ۔",
    "donor.ph.d05":
      "مہموں کی فہرست علاقہ، تاریخ اور بلڈ گروپ کے فلٹرز اور تصدیق شدہ مہم کارڈز کے ساتھ۔",
    "donor.ph.d06":
      "مہم کی تفصیل عنوان/تاریخ/مقام/ہدف کی سطر، تصدیق شدہ منتظم اور شرکت کی کارروائی کے ساتھ۔",

    "donor.home.available": "دستیاب",
    "donor.home.row102": "O- · انتہائی فوری · ہسپتال X · 2 کلومیٹر",
    "donor.home.row101": "O- · فوری · ہسپتال Y · 9 کلومیٹر",

    "donor.request.title": "درخواست #{id}",
    "donor.request.summary": "O- سرخ خلیے · 2 یونٹس · ہسپتال X شام 6 بجے تک",
    "donor.request.willing": "میں رضامند ہوں",
    "donor.request.decline": "انکار کریں",

    "donor.profile.areaPlaceholder": "کراچی",
    "donor.profile.channels": "اطلاع کے ذرائع",
    "donor.channel.sms": "SMS",
    "donor.channel.whatsapp": "واٹس ایپ",
    "donor.channel.platform": "پلیٹ فارم",
    "donor.profile.preferences": "مجھے اطلاع دیں",
    "donor.pref.urgent": "فوری",
    "donor.pref.campaignNotices": "مہم کی اطلاعات",
    "donor.profile.deleteAccount": "اکاؤنٹ حذف کریں",

    "donor.history.title": "عطیے (کل {count})",
    "donor.history.selfReported": "12 جنوری · خود رپورٹ کیا",
    "donor.history.recordedByOrg": "03 جون · تنظیم نے ریکارڈ کیا",
    "donor.history.addPast": "پچھلا عطیہ شامل کریں",
    "donor.history.remindBefore": "مجھے یاد دلائیں",
    "donor.history.remindAfter": "دن بعد",

    "donor.campaigns.filterGroup": "گروپ",
    "donor.campaigns.driveUniv": "ڈرائیو - یونیورسٹی",
    "donor.campaigns.driveMosque": "ڈرائیو - مسجد",
    "donor.campaigns.date20Nov": "20 نومبر",
    "donor.campaigns.date27Nov": "27 نومبر",

    "donor.campaign.title": "مہم",
    "donor.campaign.meta": "عنوان · تاریخ · مقام · ہدف",
    "donor.campaign.organizer": "منتظم",
    "donor.campaign.attend": "میں شرکت کا ارادہ رکھتا ہوں",
  },
};

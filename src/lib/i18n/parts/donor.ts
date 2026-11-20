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

    "donor.ph.d01":
      "Donor home with the availability toggle, the two nearest matching requests, campaigns and the profile/history links.",
    "donor.ph.d02":
      "A request with its summary, the eligibility notice and the willing/decline response buttons.",

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
    "donor.history.addPast": "Add past donation",
    "donor.history.remindBefore": "Remind me after",
    "donor.history.remindAfter": "days",

    // ---------------------------------------------------------------------
    // D-05 Campaigns browse
    // ---------------------------------------------------------------------
    "donor.campaigns.filterGroup": "Group",

    // ---------------------------------------------------------------------
    // D-06 Campaign detail
    // ---------------------------------------------------------------------
    "donor.campaign.title": "Campaign",
    "donor.campaign.organizer": "Organizer",
    "donor.campaign.attend": "I plan to attend",

    // ---------------------------------------------------------------------
    // Module 3 / 6 - donor screens D-03..D-06 (Member 4)
    // ---------------------------------------------------------------------
    "donor.profile.chooseArea": "Choose your area",
    "donor.profile.availability": "Availability",
    "donor.availability.available": "Available",
    "donor.availability.notAvailable": "Not available",
    "donor.profile.saving": "Saving…",
    "donor.profile.saved": "Profile saved.",
    "donor.profile.errorGeneric": "Something went wrong. Please try again.",
    "donor.profile.deleteHint": "Deleting removes your name, phone number and profile, and you will no longer be matched.",
    "donor.profile.deleteConfirm": "Delete your account? This cannot be undone.",
    "donor.profile.deleteYes": "Yes, delete my account",
    "donor.profile.deleteKeep": "Keep my account",
    "donor.profile.deleting": "Deleting…",
    "donor.error.bloodGroupRequired": "Choose your blood group.",
    "donor.error.bloodGroupInvalid": "Choose one of the listed blood groups.",
    "donor.error.areaRequired": "Choose your area of Karachi.",
    "donor.error.areaInvalid": "Choose one of the listed areas.",
    "donor.error.availabilityInvalid": "Choose Available or Not available.",
    "donor.error.languageInvalid": "Choose English or Urdu.",
    "donor.error.channelRequired": "Keep at least one way of being contacted selected.",
    "donor.error.dateInvalid": "Enter a valid date.",
    "donor.error.dateFuture": "The date cannot be in the future.",
    "donor.error.placeRequired": "Enter where you donated (at least 2 characters).",
    "donor.error.placeTooLong": "The place is too long (120 characters at most).",
    "donor.error.reminderInvalid": "Enter a whole number of days from 1 to 365, or leave it empty.",

    "donor.history.selfReported": "Self reported",
    "donor.history.recordedByOrg": "Recorded by org",
    "donor.history.entry": "{date} · {label}",
    "donor.history.empty": "No donations recorded yet.",
    "donor.history.addDate": "Date of donation",
    "donor.history.addPlace": "Place",
    "donor.history.addSave": "Add donation",
    "donor.history.cancelAdd": "Cancel",
    "donor.history.saving": "Saving…",
    "donor.history.added": "Donation added.",
    "donor.history.reminderSave": "Set reminder",
    "donor.history.reminderSaved": "Reminder saved.",
    "donor.history.reminderCleared": "Reminder turned off.",
    "donor.history.reminderHint": "Leave empty for no reminder. We remind you once, after your last donation.",
    "donor.history.reminderNext": "Next reminder: {date}",

    "donor.campaigns.search": "Search campaigns",
    "donor.campaigns.allAreas": "All areas",
    "donor.campaigns.allGroups": "All groups",
    "donor.campaigns.fromDate": "From date",
    "donor.campaigns.clear": "Clear filters",
    "donor.campaigns.empty": "No upcoming campaigns match.",
    "donor.campaigns.emptyHint": "Try another area, date or blood group, or check back soon.",
    "donor.campaigns.resultCount": "{count} upcoming campaign(s)",
    "donor.campaign.venue": "Venue",
    "donor.campaign.target": "Target",
    "donor.campaign.allGroups": "All blood groups",
    "donor.campaign.description": "About this campaign",
    "donor.campaign.contact": "Contact",
    "donor.campaign.attending": "You plan to attend",
    "donor.campaign.withdraw": "I no longer plan to attend",
    "donor.campaign.interestedCount": "{count} donor(s) plan to attend",
    "donor.campaign.nonBinding": "Marking interest is not a commitment. You can change your mind at any time.",
    "donor.campaign.errorGeneric": "Something went wrong. Please try again.",
    "donor.campaign.back": "Campaigns",
  },
  ur: {
    "donor.ph.wireframe": "وائرفریم {id}",
    "donor.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "donor.ph.sprint2": "سپرنٹ 2",
    "donor.owner.requests": "ماڈیول 3 · عطیہ دہندہ کی مطابقت اور جوابات",

    "donor.ph.d01":
      "عطیہ دہندہ کا ہوم: دستیابی کا ٹوگل، قریب ترین دو درخواستیں، مہمیں اور پروفائل/تاریخ کے لنک۔",
    "donor.ph.d02":
      "ایک درخواست اس کے خلاصے، اہلیت کے نوٹس اور رضامندی/انکار کے بٹنوں کے ساتھ۔",

    "donor.home.available": "دستیاب",
    "donor.home.row102": "O- · انتہائی فوری · ہسپتال X · 2 کلومیٹر",
    "donor.home.row101": "O- · فوری · ہسپتال Y · 9 کلومیٹر",

    "donor.request.title": "درخواست #{id}",
    "donor.request.summary": "O- سرخ خلیے · 2 یونٹس · ہسپتال X شام 6 بجے تک",
    "donor.request.willing": "میں رضامند ہوں",
    "donor.request.decline": "انکار کریں",

    "donor.profile.channels": "اطلاع کے ذرائع",
    "donor.channel.sms": "SMS",
    "donor.channel.whatsapp": "واٹس ایپ",
    "donor.channel.platform": "پلیٹ فارم",
    "donor.profile.preferences": "مجھے اطلاع دیں",
    "donor.pref.urgent": "فوری",
    "donor.pref.campaignNotices": "مہم کی اطلاعات",
    "donor.profile.deleteAccount": "اکاؤنٹ حذف کریں",

    "donor.history.title": "عطیے (کل {count})",
    "donor.history.addPast": "پچھلا عطیہ شامل کریں",
    "donor.history.remindBefore": "مجھے یاد دلائیں",
    "donor.history.remindAfter": "دن بعد",

    "donor.campaigns.filterGroup": "گروپ",

    "donor.campaign.title": "مہم",
    "donor.campaign.organizer": "منتظم",
    "donor.campaign.attend": "میں شرکت کا ارادہ رکھتا ہوں",

    "donor.profile.chooseArea": "اپنا علاقہ منتخب کریں",
    "donor.profile.availability": "دستیابی",
    "donor.availability.available": "دستیاب",
    "donor.availability.notAvailable": "دستیاب نہیں",
    "donor.profile.saving": "محفوظ ہو رہا ہے…",
    "donor.profile.saved": "پروفائل محفوظ ہو گیا۔",
    "donor.profile.errorGeneric": "کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔",
    "donor.profile.deleteHint": "حذف کرنے سے آپ کا نام، فون نمبر اور پروفائل ہٹ جائے گا اور آپ مماثلت میں شامل نہیں رہیں گے۔",
    "donor.profile.deleteConfirm": "کیا اپنا اکاؤنٹ حذف کریں؟ یہ عمل واپس نہیں ہو سکتا۔",
    "donor.profile.deleteYes": "ہاں، میرا اکاؤنٹ حذف کریں",
    "donor.profile.deleteKeep": "اکاؤنٹ رکھیں",
    "donor.profile.deleting": "حذف ہو رہا ہے…",
    "donor.error.bloodGroupRequired": "اپنا بلڈ گروپ منتخب کریں۔",
    "donor.error.bloodGroupInvalid": "فہرست میں سے کوئی بلڈ گروپ منتخب کریں۔",
    "donor.error.areaRequired": "کراچی میں اپنا علاقہ منتخب کریں۔",
    "donor.error.areaInvalid": "فہرست میں سے کوئی علاقہ منتخب کریں۔",
    "donor.error.availabilityInvalid": "دستیاب یا دستیاب نہیں منتخب کریں۔",
    "donor.error.languageInvalid": "انگریزی یا اردو منتخب کریں۔",
    "donor.error.channelRequired": "رابطے کا کم از کم ایک ذریعہ منتخب رکھیں۔",
    "donor.error.dateInvalid": "درست تاریخ درج کریں۔",
    "donor.error.dateFuture": "تاریخ مستقبل کی نہیں ہو سکتی۔",
    "donor.error.placeRequired": "درج کریں کہ آپ نے کہاں عطیہ دیا (کم از کم 2 حروف)۔",
    "donor.error.placeTooLong": "جگہ کا نام بہت لمبا ہے (زیادہ سے زیادہ 120 حروف)۔",
    "donor.error.reminderInvalid": "1 سے 365 تک دنوں کی پوری تعداد درج کریں، یا خالی چھوڑ دیں۔",

    "donor.history.selfReported": "خود درج کردہ",
    "donor.history.recordedByOrg": "تنظیم نے درج کیا",
    "donor.history.entry": "{date} · {label}",
    "donor.history.empty": "ابھی تک کوئی عطیہ درج نہیں۔",
    "donor.history.addDate": "عطیے کی تاریخ",
    "donor.history.addPlace": "جگہ",
    "donor.history.addSave": "عطیہ شامل کریں",
    "donor.history.cancelAdd": "منسوخ کریں",
    "donor.history.saving": "محفوظ ہو رہا ہے…",
    "donor.history.added": "عطیہ شامل ہو گیا۔",
    "donor.history.reminderSave": "یاد دہانی لگائیں",
    "donor.history.reminderSaved": "یاد دہانی محفوظ ہو گئی۔",
    "donor.history.reminderCleared": "یاد دہانی بند کر دی گئی۔",
    "donor.history.reminderHint": "یاد دہانی نہ چاہیں تو خالی چھوڑ دیں۔ ہم آپ کے آخری عطیے کے بعد ایک بار یاد دلائیں گے۔",
    "donor.history.reminderNext": "اگلی یاد دہانی: {date}",

    "donor.campaigns.search": "مہمیں تلاش کریں",
    "donor.campaigns.allAreas": "تمام علاقے",
    "donor.campaigns.allGroups": "تمام گروپس",
    "donor.campaigns.fromDate": "اس تاریخ سے",
    "donor.campaigns.clear": "فلٹر صاف کریں",
    "donor.campaigns.empty": "کوئی آنے والی مہم نہیں ملی۔",
    "donor.campaigns.emptyHint": "کوئی اور علاقہ، تاریخ یا بلڈ گروپ آزمائیں، یا کچھ دیر بعد دیکھیں۔",
    "donor.campaigns.resultCount": "{count} آنے والی مہم",
    "donor.campaign.venue": "مقام",
    "donor.campaign.target": "ہدف",
    "donor.campaign.allGroups": "تمام بلڈ گروپس",
    "donor.campaign.description": "اس مہم کے بارے میں",
    "donor.campaign.contact": "رابطہ",
    "donor.campaign.attending": "آپ شرکت کا ارادہ رکھتے ہیں",
    "donor.campaign.withdraw": "اب میرا ارادہ نہیں",
    "donor.campaign.interestedCount": "{count} عطیہ دہندہ شرکت کا ارادہ رکھتے ہیں",
    "donor.campaign.nonBinding": "دلچسپی ظاہر کرنا کوئی وعدہ نہیں۔ آپ کسی بھی وقت رائے بدل سکتے ہیں۔",
    "donor.campaign.errorGeneric": "کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔",
    "donor.campaign.back": "مہمیں",
  },
};

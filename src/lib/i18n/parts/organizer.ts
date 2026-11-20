import type { DictionaryPart } from "../types";

/**
 * Campaign organizer labels (O-01..O-03) used by the Sprint 1 screen shells.
 *
 * Campaign creation, approval and completion belong to Module 6 (Member 4)
 * and are part of the Sprint 1 scope.
 */
export const organizer: DictionaryPart = {
  en: {
    // ---------------------------------------------------------------------
    // Shared ownership notice (O-01..O-03)
    // ---------------------------------------------------------------------


    // ---------------------------------------------------------------------
    // O-01 Create campaign
    // ---------------------------------------------------------------------
    "organizer.campaign.venue": "Venue",
    "organizer.campaign.targetGroups": "Target groups",
    "organizer.campaign.saveDraft": "Save draft",
    "organizer.campaign.submit": "Submit for approval",

    // ---------------------------------------------------------------------
    // O-02 My campaigns
    // ---------------------------------------------------------------------
    "organizer.campaign.statusDraft": "Draft",
    "organizer.campaign.statusPending": "Pending",
    "organizer.campaign.statusApproved": "Approved",
    "organizer.campaign.cancel": "Cancel campaign",

    // ---------------------------------------------------------------------
    // O-03 Completion form
    // ---------------------------------------------------------------------
    "organizer.complete.attendees": "Attendees",
    "organizer.complete.donations": "Donations",
    "organizer.complete.donorPhone": "Record donor phone",

    // ---------------------------------------------------------------------
    // Module 6 - organizer screens O-01..O-03 (Member 4)
    // ---------------------------------------------------------------------
    "organizer.campaign.titleEn": "Title (English)",
    "organizer.campaign.titleUr": "Title (Urdu)",
    "organizer.campaign.descriptionEn": "Description (English)",
    "organizer.campaign.descriptionUr": "Description (Urdu)",
    "organizer.campaign.chooseArea": "Choose an area",
    "organizer.campaign.allGroups": "All blood groups",
    "organizer.campaign.contactPhone": "Contact phone",
    "organizer.campaign.contactEmail": "Contact email",
    "organizer.campaign.saving": "Saving…",
    "organizer.campaign.saveChanges": "Save changes",
    "organizer.campaign.statusRejected": "Rejected",
    "organizer.campaign.statusCancelled": "Cancelled",
    "organizer.campaign.statusCompleted": "Completed",
    "organizer.campaign.empty": "You have no campaigns yet.",
    "organizer.campaign.new": "New campaign",
    "organizer.campaign.interested": "{count} interested",
    "organizer.campaign.cancelConfirm": "Cancel this campaign? Donors who marked interest will be told.",
    "organizer.campaign.cancelYes": "Yes, cancel it",
    "organizer.campaign.cancelKeep": "Keep it",
    "organizer.campaign.cancelling": "Cancelling…",
    "organizer.campaign.changesPending": "Your changes are waiting for administrator approval. Donors still see the approved version until then.",
    "organizer.campaign.reviewReason": "Administrator's note: {reason}",
    "organizer.campaign.errorGeneric": "Something went wrong. Please try again.",
    "organizer.campaign.editHint": "Changing the date, time, venue or description of an approved campaign needs administrator approval again.",
    "organizer.detail.interestedTitle": "Interested donors ({count})",
    "organizer.detail.noInterested": "No donor has marked interest yet.",
    "organizer.detail.recordOutcomes": "Record outcomes",
    "organizer.detail.back": "My campaigns",
    "organizer.detail.edit": "Edit campaign",
    "organizer.detail.locked": "This campaign can no longer be edited.",
    "organizer.complete.title": "{title} completed",
    "organizer.complete.saving": "Saving…",
    "organizer.complete.saved": "Outcome saved.",
    "organizer.complete.donorRecorded": "Donation recorded for that donor.",
    "organizer.complete.recordedCount": "{count} registered donor(s) recorded so far",
    "organizer.complete.donorHint": "Optional. Enter a registered donor's mobile number to add this donation to their history. Save again for each donor.",
    "organizer.complete.notReady": "Outcomes can be entered once the campaign has started.",
    "organizer.error.titleRequired": "Enter a title (at least 3 characters).",
    "organizer.error.titleTooLong": "The title is too long (120 characters at most).",
    "organizer.error.titleUrRequired": "Enter the Urdu title before submitting.",
    "organizer.error.descriptionRequired": "Describe the campaign (at least 10 characters) before submitting.",
    "organizer.error.descriptionTooLong": "The description is too long (2000 characters at most).",
    "organizer.error.dateInvalid": "Enter a valid date.",
    "organizer.error.timeInvalid": "Enter a valid time.",
    "organizer.error.datePast": "The campaign must be in the future.",
    "organizer.error.venueRequired": "Enter the venue address in Karachi (at least 5 characters).",
    "organizer.error.venueTooLong": "The venue is too long (200 characters at most).",
    "organizer.error.areaRequired": "Choose the area of Karachi.",
    "organizer.error.areaInvalid": "Choose one of the listed areas.",
    "organizer.error.groupsInvalid": "Choose a valid blood group.",
    "organizer.error.phoneInvalid": "Enter a valid contact phone number.",
    "organizer.error.phoneRequired": "Enter a contact phone number before submitting.",
    "organizer.error.emailInvalid": "Enter a valid email address.",
    "organizer.error.attendeesInvalid": "Enter a whole number of attendees.",
    "organizer.error.donationsInvalid": "Enter a whole number of donations.",
    "organizer.error.donationsTooMany": "Donations cannot be more than attendees.",
    "organizer.error.donationsBelowRecorded": "Donations cannot be fewer than the donors already recorded.",
    "organizer.error.donorPhoneInvalid": "Enter a valid Pakistani mobile number.",
    "organizer.error.donorNotFound": "No registered donor has that mobile number.",
    "organizer.error.donorAlreadyRecorded": "A donation for that donor is already recorded for this campaign.",
  },
  ur: {


    "organizer.campaign.venue": "مقام",
    "organizer.campaign.targetGroups": "ہدف گروپس",
    "organizer.campaign.saveDraft": "ڈرافٹ محفوظ کریں",
    "organizer.campaign.submit": "منظوری کے لیے جمع کریں",

    "organizer.campaign.statusDraft": "ڈرافٹ",
    "organizer.campaign.statusPending": "زیرِ التوا",
    "organizer.campaign.statusApproved": "منظور",
    "organizer.campaign.cancel": "مہم منسوخ کریں",

    "organizer.complete.attendees": "شرکاء",
    "organizer.complete.donations": "عطیے",
    "organizer.complete.donorPhone": "عطیہ دہندہ کا فون ریکارڈ کریں",

    "organizer.campaign.titleEn": "عنوان (انگریزی)",
    "organizer.campaign.titleUr": "عنوان (اردو)",
    "organizer.campaign.descriptionEn": "تفصیل (انگریزی)",
    "organizer.campaign.descriptionUr": "تفصیل (اردو)",
    "organizer.campaign.chooseArea": "علاقہ منتخب کریں",
    "organizer.campaign.allGroups": "تمام بلڈ گروپس",
    "organizer.campaign.contactPhone": "رابطے کا فون",
    "organizer.campaign.contactEmail": "رابطے کی ای میل",
    "organizer.campaign.saving": "محفوظ ہو رہا ہے…",
    "organizer.campaign.saveChanges": "تبدیلیاں محفوظ کریں",
    "organizer.campaign.statusRejected": "مسترد",
    "organizer.campaign.statusCancelled": "منسوخ",
    "organizer.campaign.statusCompleted": "مکمل",
    "organizer.campaign.empty": "آپ کی ابھی کوئی مہم نہیں۔",
    "organizer.campaign.new": "نئی مہم",
    "organizer.campaign.interested": "{count} دلچسپی رکھتے ہیں",
    "organizer.campaign.cancelConfirm": "کیا یہ مہم منسوخ کریں؟ دلچسپی ظاہر کرنے والے عطیہ دہندگان کو اطلاع دی جائے گی۔",
    "organizer.campaign.cancelYes": "ہاں، منسوخ کریں",
    "organizer.campaign.cancelKeep": "رہنے دیں",
    "organizer.campaign.cancelling": "منسوخ ہو رہی ہے…",
    "organizer.campaign.changesPending": "آپ کی تبدیلیاں ایڈمنسٹریٹر کی منظوری کی منتظر ہیں۔ تب تک عطیہ دہندگان کو پہلے سے منظور شدہ ورژن نظر آتا رہے گا۔",
    "organizer.campaign.reviewReason": "ایڈمنسٹریٹر کا نوٹ: {reason}",
    "organizer.campaign.errorGeneric": "کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔",
    "organizer.campaign.editHint": "منظور شدہ مہم کی تاریخ، وقت، مقام یا تفصیل بدلنے پر دوبارہ ایڈمنسٹریٹر کی منظوری درکار ہوتی ہے۔",
    "organizer.detail.interestedTitle": "دلچسپی رکھنے والے عطیہ دہندگان ({count})",
    "organizer.detail.noInterested": "ابھی کسی عطیہ دہندہ نے دلچسپی ظاہر نہیں کی۔",
    "organizer.detail.recordOutcomes": "نتائج درج کریں",
    "organizer.detail.back": "میری مہمیں",
    "organizer.detail.edit": "مہم میں ترمیم",
    "organizer.detail.locked": "اس مہم میں اب ترمیم نہیں ہو سکتی۔",
    "organizer.complete.title": "{title} مکمل",
    "organizer.complete.saving": "محفوظ ہو رہا ہے…",
    "organizer.complete.saved": "نتیجہ محفوظ ہو گیا۔",
    "organizer.complete.donorRecorded": "اس عطیہ دہندہ کے لیے عطیہ درج ہو گیا۔",
    "organizer.complete.recordedCount": "اب تک {count} رجسٹرڈ عطیہ دہندہ درج ہوئے",
    "organizer.complete.donorHint": "اختیاری۔ رجسٹرڈ عطیہ دہندہ کا موبائل نمبر لکھیں تاکہ یہ عطیہ اس کی تاریخ میں شامل ہو۔ ہر عطیہ دہندہ کے لیے دوبارہ محفوظ کریں۔",
    "organizer.complete.notReady": "مہم شروع ہونے کے بعد ہی نتائج درج ہو سکتے ہیں۔",
    "organizer.error.titleRequired": "عنوان درج کریں (کم از کم 3 حروف)۔",
    "organizer.error.titleTooLong": "عنوان بہت لمبا ہے (زیادہ سے زیادہ 120 حروف)۔",
    "organizer.error.titleUrRequired": "جمع کرنے سے پہلے اردو عنوان درج کریں۔",
    "organizer.error.descriptionRequired": "جمع کرنے سے پہلے مہم کی تفصیل لکھیں (کم از کم 10 حروف)۔",
    "organizer.error.descriptionTooLong": "تفصیل بہت لمبی ہے (زیادہ سے زیادہ 2000 حروف)۔",
    "organizer.error.dateInvalid": "درست تاریخ درج کریں۔",
    "organizer.error.timeInvalid": "درست وقت درج کریں۔",
    "organizer.error.datePast": "مہم مستقبل میں ہونی چاہیے۔",
    "organizer.error.venueRequired": "کراچی میں مقام کا پتہ درج کریں (کم از کم 5 حروف)۔",
    "organizer.error.venueTooLong": "مقام کا پتہ بہت لمبا ہے (زیادہ سے زیادہ 200 حروف)۔",
    "organizer.error.areaRequired": "کراچی کا علاقہ منتخب کریں۔",
    "organizer.error.areaInvalid": "فہرست میں سے کوئی علاقہ منتخب کریں۔",
    "organizer.error.groupsInvalid": "درست بلڈ گروپ منتخب کریں۔",
    "organizer.error.phoneInvalid": "رابطے کا درست فون نمبر درج کریں۔",
    "organizer.error.phoneRequired": "جمع کرنے سے پہلے رابطے کا فون نمبر درج کریں۔",
    "organizer.error.emailInvalid": "درست ای میل پتہ درج کریں۔",
    "organizer.error.attendeesInvalid": "شرکاء کی پوری تعداد درج کریں۔",
    "organizer.error.donationsInvalid": "عطیوں کی پوری تعداد درج کریں۔",
    "organizer.error.donationsTooMany": "عطیے شرکاء سے زیادہ نہیں ہو سکتے۔",
    "organizer.error.donationsBelowRecorded": "عطیے پہلے سے درج عطیہ دہندگان سے کم نہیں ہو سکتے۔",
    "organizer.error.donorPhoneInvalid": "درست پاکستانی موبائل نمبر درج کریں۔",
    "organizer.error.donorNotFound": "اس موبائل نمبر کا کوئی رجسٹرڈ عطیہ دہندہ نہیں ملا۔",
    "organizer.error.donorAlreadyRecorded": "اس عطیہ دہندہ کا عطیہ اس مہم کے لیے پہلے سے درج ہے۔",
  },
};

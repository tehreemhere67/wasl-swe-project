import type { DictionaryPart } from "../types";

/**
 * Hospital area labels (H-01..H-07) used by the Sprint 1 screen shells.
 *
 * The screens are structural: the request module (Module REQ) builds their
 * logic in Sprint 2 and the hospital availability search module (Module 5)
 * builds H-01/H-02 in Sprint 1. The ownership is shown on screen by the
 * Placeholder notice.
 */
export const hospital: DictionaryPart = {
  en: {
    // ---------------------------------------------------------------------
    // Shared ownership notice (H-01..H-07)
    // ---------------------------------------------------------------------
    "hospital.ph.wireframe": "Wireframe {id}",
    "hospital.ph.sprint1": "Sprint 1 — module owner builds this",
    "hospital.ph.sprint2": "Sprint 2",
    "hospital.owner.requests": "Module REQ · Blood requests",
    "hospital.owner.search": "Module 5 · Hospital availability search",

    "hospital.ph.h01":
      "Hospital home: the search and new-request actions, the active-requests list and the notifications link.",
    "hospital.ph.h02":
      "Availability search form, one example result with the 'as reported by blood bank' statement, and the empty state.",
    "hospital.ph.h03":
      "Create-request form: blood group, component, units, urgency, needed-by time, contact person and collection bank.",
    "hospital.ph.h04":
      "Confirmation after submitting a request, with the matching blood banks and the potential-match count.",
    "hospital.ph.h05":
      "Request detail: status, the close actions, willing donors with their outcomes and the bank offers.",
    "hospital.ph.h06": "Edit an open request, or cancel it with a reason.",
    "hospital.ph.h07":
      "The hospital's requests with a status filter, so each request can be found again.",

    // ---------------------------------------------------------------------
    // H-01 Dashboard
    // ---------------------------------------------------------------------
    "hospital.dashboard.activeRequests": "Active requests",

    // ---------------------------------------------------------------------
    // H-02 Inventory search
    // ---------------------------------------------------------------------
    "hospital.search.anyGroup": "Any blood group",
    "hospital.search.anyComponent": "Any component",
    "hospital.search.expiry": "Exp 12 Nov",
    "hospital.search.sampleArea": "Saddar",
    "hospital.search.empty": "Empty",
    "hospital.search.emptyHint": "No blood bank has reported this combination yet.",

    // Sample organization names shown in the structural rows.
    "hospital.sample.bankA": "Bank A",
    "hospital.sample.bankB": "Bank B",

    // ---------------------------------------------------------------------
    // H-03 Create request
    // ---------------------------------------------------------------------
    "hospital.req.urgency": "Urgency",
    "hospital.req.critical": "Critical",
    "hospital.req.urgent": "Urgent",
    "hospital.req.planned": "Planned",
    "hospital.req.neededBy": "Needed by",
    "hospital.req.contactPerson": "Contact person",
    "hospital.req.collectionBank": "Collection blood bank",
    "hospital.req.selectBank": "Select blood bank",
    "hospital.req.noPatientNames": "No patient names",

    // ---------------------------------------------------------------------
    // H-04 Confirmation + matching banks
    // ---------------------------------------------------------------------
    "hospital.match.title": "Request #{id}",
    "hospital.match.potential": "{count} potential matches",
    "hospital.match.viewRequest": "View request",

    // ---------------------------------------------------------------------
    // H-05 Request detail (also used by the H-07 status filter)
    // ---------------------------------------------------------------------
    "hospital.detail.title": "#{id} {group} {component}",
    "hospital.reqStatus.all": "All",
    "hospital.reqStatus.open": "Open",
    "hospital.reqStatus.partial": "Partially Fulfilled",
    "hospital.reqStatus.fulfilled": "Fulfilled",
    "hospital.reqStatus.cancelled": "Cancelled",
    "hospital.reqStatus.expired": "Expired",
    "hospital.detail.markPartial": "Mark partial",
    "hospital.detail.markFulfilled": "Fulfilled",
    "hospital.detail.willingDonors": "Willing donors",
    "hospital.detail.donorAli": "Ali",
    "hospital.detail.contacted": "Contacted",
    "hospital.detail.donated": "Donated",
    "hospital.detail.didNotDonate": "Did not donate",
    "hospital.detail.bankOffers": "Bank offers",

    // ---------------------------------------------------------------------
    // H-06 Edit / cancel request
    // ---------------------------------------------------------------------
    "hospital.edit.title": "Edit request",
    "hospital.edit.cancelSection": "Cancel request",
    "hospital.edit.cancelReason": "Reason for cancellation",
    "hospital.edit.cancelRequest": "Cancel request",

    // ---------------------------------------------------------------------
    // H-07 My requests
    // ---------------------------------------------------------------------
    "hospital.requests.sampleOpen": "#102 · O- red cells · 2 units",
    "hospital.requests.samplePartial": "#101 · O- red cells · 1 unit",
  },
  ur: {
    // Shared ownership notice
    "hospital.ph.wireframe": "وائرفریم {id}",
    "hospital.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "hospital.ph.sprint2": "سپرنٹ 2",
    "hospital.owner.requests": "ماڈیول REQ · خون کی درخواستیں",
    "hospital.owner.search": "ماڈیول 5 · ہسپتال میں دستیابی کی تلاش",

    "hospital.ph.h01":
      "ہسپتال کا ہوم: خون تلاش کرنے اور نئی درخواست کی کارروائیاں، فعال درخواستوں کی فہرست اور اطلاعات کا لنک۔",
    "hospital.ph.h02":
      "دستیابی کی تلاش کا فارم، ایک مثال کا نتیجہ 'بلڈ بینک کی بتائی گئی' کے بیان کے ساتھ، اور خالی حالت۔",
    "hospital.ph.h03":
      "درخواست بنانے کا فارم: بلڈ گروپ، کمپوننٹ، یونٹس، فوریت، کب تک درکار، رابطہ شخص اور خون جمع کرنے والا بلڈ بینک۔",
    "hospital.ph.h04":
      "درخواست جمع کرنے کے بعد تصدیق، مماثل بلڈ بینکوں اور ممکنہ مماثلتوں کی گنتی کے ساتھ۔",
    "hospital.ph.h05":
      "درخواست کی تفصیل: حیثیت، بند کرنے کی کارروائیاں، رضامند عطیہ دہندگان اور ان کے نتائج، اور بلڈ بینک کی پیشکشیں۔",
    "hospital.ph.h06": "کھلی درخواست میں ترمیم کریں، یا وجہ کے ساتھ اسے منسوخ کریں۔",
    "hospital.ph.h07": "ہسپتال کی درخواستیں حیثیت کے فلٹر کے ساتھ، تاکہ ہر درخواست دوبارہ مل سکے۔",

    // H-01 Dashboard
    "hospital.dashboard.activeRequests": "فعال درخواستیں",

    // H-02 Inventory search
    "hospital.search.anyGroup": "کوئی بھی بلڈ گروپ",
    "hospital.search.anyComponent": "کوئی بھی کمپوننٹ",
    "hospital.search.expiry": "میعاد 12 نومبر",
    "hospital.search.sampleArea": "صدر",
    "hospital.search.empty": "خالی",
    "hospital.search.emptyHint": "ابھی کسی بلڈ بینک نے یہ امتزاج نہیں بتایا۔",

    "hospital.sample.bankA": "بینک اے",
    "hospital.sample.bankB": "بینک بی",

    // H-03 Create request
    "hospital.req.urgency": "فوریت",
    "hospital.req.critical": "انتہائی فوری",
    "hospital.req.urgent": "فوری",
    "hospital.req.planned": "منصوبہ بند",
    "hospital.req.neededBy": "کب تک درکار ہے",
    "hospital.req.contactPerson": "رابطہ کرنے والا شخص",
    "hospital.req.collectionBank": "خون جمع کرنے والا بلڈ بینک",
    "hospital.req.selectBank": "بلڈ بینک منتخب کریں",
    "hospital.req.noPatientNames": "مریض کے نام نہیں",

    // H-04 Confirmation + matching banks
    "hospital.match.title": "درخواست #{id}",
    "hospital.match.potential": "{count} ممکنہ مماثلتیں",
    "hospital.match.viewRequest": "درخواست دیکھیں",

    // H-05 Request detail
    "hospital.detail.title": "#{id} {group} {component}",
    "hospital.reqStatus.all": "تمام",
    "hospital.reqStatus.open": "کھلی",
    "hospital.reqStatus.partial": "جزوی طور پر مکمل",
    "hospital.reqStatus.fulfilled": "مکمل",
    "hospital.reqStatus.cancelled": "منسوخ",
    "hospital.reqStatus.expired": "میعاد ختم",
    "hospital.detail.markPartial": "جزوی نشان زد کریں",
    "hospital.detail.markFulfilled": "مکمل",
    "hospital.detail.willingDonors": "رضامند عطیہ دہندگان",
    "hospital.detail.donorAli": "علی",
    "hospital.detail.contacted": "رابطہ کیا",
    "hospital.detail.donated": "عطیہ کیا",
    "hospital.detail.didNotDonate": "عطیہ نہیں کیا",
    "hospital.detail.bankOffers": "بلڈ بینک کی پیشکشیں",

    // H-06 Edit / cancel request
    "hospital.edit.title": "درخواست میں ترمیم",
    "hospital.edit.cancelSection": "درخواست منسوخ کریں",
    "hospital.edit.cancelReason": "منسوخی کی وجہ",
    "hospital.edit.cancelRequest": "درخواست منسوخ کریں",

    // H-07 My requests
    "hospital.requests.sampleOpen": "#102 · O- سرخ خلیے · 2 یونٹس",
    "hospital.requests.samplePartial": "#101 · O- سرخ خلیے · 1 یونٹ",
  },
};

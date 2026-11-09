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
    "organizer.ph.wireframe": "Wireframe {id}",
    "organizer.ph.sprint1": "Sprint 1 — module owner builds this",
    "organizer.owner.campaigns": "Module 6 · Donation campaigns",

    "organizer.ph.o01":
      "Create-campaign form with the bilingual title and description, schedule, venue and target groups.",
    "organizer.ph.o02":
      "The organizer's campaigns with their draft/pending/approved status and the cancel action.",
    "organizer.ph.o03":
      "Campaign completion form with attendees, donations and the donor phone recorded at the drive.",

    // ---------------------------------------------------------------------
    // O-01 Create campaign
    // ---------------------------------------------------------------------
    "organizer.campaign.titleLabel": "Title (English / Urdu)",
    "organizer.campaign.descriptionLabel": "Description (English / Urdu)",
    "organizer.campaign.venue": "Venue",
    "organizer.campaign.targetGroups": "Target groups",
    "organizer.campaign.saveDraft": "Save draft",
    "organizer.campaign.submit": "Submit for approval",

    // ---------------------------------------------------------------------
    // O-02 My campaigns
    // ---------------------------------------------------------------------
    "organizer.campaign.drive1": "Drive 1",
    "organizer.campaign.drive2": "Drive 2",
    "organizer.campaign.drive3": "Drive 3",
    "organizer.campaign.statusDraft": "Draft",
    "organizer.campaign.statusPending": "Pending",
    "organizer.campaign.statusApproved": "Approved",
    "organizer.campaign.cancel": "Cancel campaign",

    // ---------------------------------------------------------------------
    // O-03 Completion form
    // ---------------------------------------------------------------------
    "organizer.complete.title": "Drive 3 completed",
    "organizer.complete.attendees": "Attendees",
    "organizer.complete.donations": "Donations",
    "organizer.complete.donorPhone": "Record donor phone",
  },
  ur: {
    "organizer.ph.wireframe": "وائرفریم {id}",
    "organizer.ph.sprint1": "سپرنٹ 1 — ماڈیول کا ذمہ دار یہ بناتا ہے",
    "organizer.owner.campaigns": "ماڈیول 6 · عطیے کی مہمیں",

    "organizer.ph.o01":
      "مہم بنانے کا فارم دو لسانی عنوان اور تفصیل، تاریخ و وقت، مقام اور ہدف گروپس کے ساتھ۔",
    "organizer.ph.o02":
      "منتظم کی مہمیں ڈرافٹ/زیرِ التوا/منظور کی حیثیت اور منسوخ کرنے کی کارروائی کے ساتھ۔",
    "organizer.ph.o03":
      "مہم کی تکمیل کا فارم شرکاء، عطیوں اور مہم میں ریکارڈ کیے گئے عطیہ دہندہ کے فون کے ساتھ۔",

    "organizer.campaign.titleLabel": "عنوان (انگریزی / اردو)",
    "organizer.campaign.descriptionLabel": "تفصیل (انگریزی / اردو)",
    "organizer.campaign.venue": "مقام",
    "organizer.campaign.targetGroups": "ہدف گروپس",
    "organizer.campaign.saveDraft": "ڈرافٹ محفوظ کریں",
    "organizer.campaign.submit": "منظوری کے لیے جمع کریں",

    "organizer.campaign.drive1": "ڈرائیو 1",
    "organizer.campaign.drive2": "ڈرائیو 2",
    "organizer.campaign.drive3": "ڈرائیو 3",
    "organizer.campaign.statusDraft": "ڈرافٹ",
    "organizer.campaign.statusPending": "زیرِ التوا",
    "organizer.campaign.statusApproved": "منظور",
    "organizer.campaign.cancel": "مہم منسوخ کریں",

    "organizer.complete.title": "ڈرائیو 3 مکمل",
    "organizer.complete.attendees": "شرکاء",
    "organizer.complete.donations": "عطیے",
    "organizer.complete.donorPhone": "عطیہ دہندہ کا فون ریکارڈ کریں",
  },
};

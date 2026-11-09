import type { DictionaryPart } from "../types";

/**
 * Role-specific navigation - IR-02 ("each user class shall see navigation and
 * screens for its own features only") and the navigation maps in the
 * wireframes (sheets 12, 13 and 14).
 */
export const nav: DictionaryPart = {
  en: {
    // Hospital - H-01..H-07
    "nav.hospital.dashboard": "Dashboard",
    "nav.hospital.search": "Search blood",
    "nav.hospital.newRequest": "New request",
    "nav.hospital.requests": "My requests",
    "nav.hospital.notifications": "Notifications",
    "nav.hospital.area": "Hospital",

    // Blood bank - B-01..B-07
    "nav.bank.dashboard": "Dashboard",
    "nav.bank.inventory": "Inventory",
    "nav.bank.addBatch": "Add batch",
    "nav.bank.openRequests": "Open requests",
    "nav.bank.recordDonation": "Record donation",
    "nav.bank.settings": "Settings",
    "nav.bank.area": "Blood bank",

    // Donor - D-01..D-06
    "nav.donor.home": "Home",
    "nav.donor.campaigns": "Campaigns",
    "nav.donor.history": "History",
    "nav.donor.profile": "Profile",
    "nav.donor.area": "Donor",

    // Campaign organiser - O-01..O-03
    "nav.organizer.create": "Create campaign",
    "nav.organizer.campaigns": "My campaigns",
    "nav.organizer.area": "Campaigns",

    // Administrator - A-01..A-08
    "nav.admin.verify": "Verify organizations",
    "nav.admin.campaigns": "Campaign review",
    "nav.admin.flags": "Flags + hide content",
    "nav.admin.inventoryReports": "Inventory",
    "nav.admin.reports": "Reports",
    "nav.admin.audit": "Audit log",
    "nav.admin.settings": "Settings + areas",
    "nav.admin.accounts": "Accounts",
    "nav.admin.area": "Administration",
  },
  ur: {
    "nav.hospital.dashboard": "ڈیش بورڈ",
    "nav.hospital.search": "خون تلاش کریں",
    "nav.hospital.newRequest": "نئی درخواست",
    "nav.hospital.requests": "میری درخواستیں",
    "nav.hospital.notifications": "اطلاعات",
    "nav.hospital.area": "ہسپتال",

    "nav.bank.dashboard": "ڈیش بورڈ",
    "nav.bank.inventory": "انوینٹری",
    "nav.bank.addBatch": "بیچ شامل کریں",
    "nav.bank.openRequests": "کھلی درخواستیں",
    "nav.bank.recordDonation": "عطیہ ریکارڈ کریں",
    "nav.bank.settings": "ترتیبات",
    "nav.bank.area": "بلڈ بینک",

    "nav.donor.home": "ہوم",
    "nav.donor.campaigns": "مہمیں",
    "nav.donor.history": "تاریخ",
    "nav.donor.profile": "پروفائل",
    "nav.donor.area": "عطیہ دہندہ",

    "nav.organizer.create": "مہم بنائیں",
    "nav.organizer.campaigns": "میری مہمیں",
    "nav.organizer.area": "مہمیں",

    "nav.admin.verify": "تنظیموں کی تصدیق",
    "nav.admin.campaigns": "مہم کا جائزہ",
    "nav.admin.flags": "شکایات + مواد چھپائیں",
    "nav.admin.inventoryReports": "انوینٹری",
    "nav.admin.reports": "رپورٹس",
    "nav.admin.audit": "آڈٹ لاگ",
    "nav.admin.settings": "ترتیبات + علاقے",
    "nav.admin.accounts": "اکاؤنٹس",
    "nav.admin.area": "انتظامیہ",
  },
};

import type { DictionaryPart } from "../types";

/**
 * Module 9 - notification access on every screen, and the notification centre
 * (G-05). Notification *content* is produced by the other modules; this part
 * only holds the shared labels for displaying them.
 */
export const notifications: DictionaryPart = {
  en: {
    "notif.title": "Notification centre",
    "notif.subtitle": "Every notification is stored here, even when SMS or WhatsApp is unavailable.",
    "notif.unread": "{count} unread",
    "notif.allRead": "Nothing unread.",
    "notif.empty": "No notifications yet.",
    "notif.markAllRead": "Mark all as read",
    "notif.markRead": "Mark as read",
    "notif.deliveryLabel": "Delivery",
    "notif.open": "Open",
    "notif.delivery.in_platform": "In-platform",
    "notif.delivery.sent": "Sent",
    "notif.delivery.delivered": "Delivered",
    "notif.delivery.failed": "Failed",
    "notif.category.verification": "Registration update",
    "notif.category.account": "Account",
    "notif.category.urgent_request": "Urgent request",
    "notif.category.campaign": "Campaign",
    "notif.category.request_closed": "Request closed",
    "notif.category.general": "General",
    "notif.viewAll": "View all notifications",
    "notif.errorMarkRead": "Could not update the notification. Try again.",
  },
  ur: {
    "notif.title": "اطلاعات کا مرکز",
    "notif.subtitle": "ہر اطلاع یہاں محفوظ ہوتی ہے، چاہے SMS یا واٹس ایپ دستیاب نہ ہو۔",
    "notif.unread": "{count} غیر پڑھی",
    "notif.allRead": "کوئی غیر پڑھی اطلاع نہیں۔",
    "notif.empty": "ابھی کوئی اطلاع نہیں۔",
    "notif.markAllRead": "سب پڑھا ہوا نشان زد کریں",
    "notif.markRead": "پڑھا ہوا نشان زد کریں",
    "notif.deliveryLabel": "ڈیلیوری",
    "notif.open": "کھولیں",
    "notif.delivery.in_platform": "پلیٹ فارم پر",
    "notif.delivery.sent": "بھیجا گیا",
    "notif.delivery.delivered": "پہنچایا گیا",
    "notif.delivery.failed": "ناکام",
    "notif.category.verification": "رجسٹریشن کی اطلاع",
    "notif.category.account": "اکاؤنٹ",
    "notif.category.urgent_request": "فوری درخواست",
    "notif.category.campaign": "مہم",
    "notif.category.request_closed": "درخواست بند",
    "notif.category.general": "عمومی",
    "notif.viewAll": "تمام اطلاعات دیکھیں",
    "notif.errorMarkRead": "اطلاع اپ ڈیٹ نہیں ہو سکی۔ دوبارہ کوشش کریں۔",
  },
};

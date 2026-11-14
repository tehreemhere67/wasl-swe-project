# Wasl User Manual — Blood Bank

**For:** staff of a verified blood bank.
**Covers:** the dashboard, inventory, batch actions, reservations, transfers,
settings and alerts (Modules 4 and 7).

---

## 1. Signing in

1. Open the Wasl website.
2. Enter your organisation email and password, then **Log in**.
3. You land on **Dashboard** (`/bank`). If your organisation is still Pending,
   Rejected or Suspended you will see the account-status screen instead — ask the
   Wasl administrator to review your registration.

The top bar shows your bank's name with a **Verified** badge, the language switch
(English / اردو), the notification bell and your profile menu. The bar below it
opens **Dashboard · Inventory · Add batch · Open requests · Record donation ·
Settings**.

## 2. The dashboard and its alerts (`/bank`)

- The heading shows your bank, the **Verified** badge and **Alerts (n)**.
- Each alert is a box:
  - **Expiry warning: A+ Platelets** — *5 units expire on 15 Nov 2026.*
  - **Low stock: AB− Plasma** — *Only 4 units left.*
- **Open batch** jumps to that batch so you can act on it.
- **Acknowledge** marks the alert as seen: it leaves the dashboard and will not
  come back for 24 hours unless the situation changes.
- Alerts disappear on their own when the problem is fixed (stock refilled, batch
  emptied or archived, units expired).
- The bottom line shows when monitoring last ran.

## 3. The inventory list (`/bank/inventory`)

Each row is one **batch**:

| Column | Meaning |
| --- | --- |
| Blood group | A+, A−, B+, B−, AB+, AB−, O+, O− |
| **Batch** | A short reference such as `#1C61B494` — use it to tell identical rows apart |
| Component | Whole blood, Red blood cells, Platelets, Plasma |
| **Available** | Units a hospital may rely on right now |
| **Reserved** | Units promised to a request (not available until released) |
| Status | Awaiting testing · Approved · Rejected |
| Expiry | The date the batch stops being usable |

Only **Approved**, unexpired, unreserved units count as *Available*. On a phone the
same information appears as cards. **+ Add batch** is the wide button under the
list.

## 4. Adding a batch (`/bank/inventory/new`)

1. Choose **Blood group** and **Component**.
2. Enter **Units** — a whole number, never negative.
3. Choose **Testing status** (usually *Awaiting testing* until your lab approves it).
4. Enter the **Expiry date** — it must be in the future. A date means the end of
   that day.
5. **Save batch**. You return to Inventory and the batch appears with an
   `Added +N` entry in its history.

If a field is wrong you get a message under it and nothing is saved. Pressing Save
twice quickly creates only one batch.

## 5. Editing or approving a batch

Open a batch → **Edit batch**. You can correct the group, component, units, status
or expiry. Every save writes one **Correction** entry in the history, and a status
change is shown as *Status: Awaiting testing → Approved*.

Use this to move a batch from **Awaiting testing** to **Approved** — until then it
does not count as available.

## 6. Recording stock leaving (`/bank/inventory/[id]`)

Open a batch → **Record a change**:

| Action | When to use | History entry |
| --- | --- | --- |
| **Issue units** | Units leave for a hospital | `Issued −N` (add the hospital in the note) |
| **Discard units** | Units were wasted or unusable | `Discarded −N` |
| **Mark expired** | The batch reached its date | `Expired −N` (clears the rest) |
| **Correct quantity** | The stored number is wrong | `Correction ±N` (a reason is required) |

**Nothing is deleted.** The batch keeps every entry, so the quantity can always be
explained. You cannot remove more units than the batch holds.

## 7. Reservations

On the batch page, under **Reservations**:

1. Enter units and a hold period (default **6 hours**, 1–72 allowed).
2. **Reserve units** — *Available* drops, *Reserved* rises, and the history gets
   `Reserved −N`.
3. **Release** ends a hold early; it releases itself when the hold period ends.

Reserved units still physically exist, but they are not offered to hospitals.

## 8. Transfers to another blood bank

1. On the batch → **Transfer out**.
2. Choose the **receiving blood bank** (only verified banks appear).
3. Enter units and a note, then **Confirm**.

Wasl does not move stock itself. Your batch drops and its history shows
`Transferred out −N` with **To <bank>**. The receiving bank records its own
incoming batch with **+ Add batch** at their end.

## 9. Removing a batch from the list

Once a batch holds **0 units** (issued, discarded or expired), a **Remove from
list** button appears on its page. Removing it hides it from Inventory; the record
and its history are kept and remain reachable from the old link. A batch that still
holds units cannot be removed — reduce it first.

## 10. Settings (`/bank/settings`)

- **Low-stock threshold** — one box for every blood group and component. Leave a
  box empty to use the default of **5 units**. You get a *Low stock* alert when
  available stock is at or below the number.
- **Expiry warning windows** — how many days before expiry each component starts
  warning. Defaults: platelets **2**, whole blood **7**, red blood cells **7**,
  plasma **30**.
- **Send SMS alerts** — tick to also receive alerts by text message, when the
  messaging service is configured. Unticked means in-platform alerts only.
- **Save settings** — changes apply immediately.

## 11. Notifications and language

- The bell shows unread notifications. Every alert is also stored in the
  notification centre (`/notifications`).
- The language switch changes the whole interface to English or اردو; Urdu reads
  right to left.

## 12. Common questions

**Why is a batch not showing as available?**
It is not Approved, it has expired, all its units are reserved, or your
organisation is not Verified.

**Why is Available lower than the units I entered?**
Some units are reserved. *Available = units − active reservations*.

**Why did an alert disappear without me acknowledging it?**
The condition was fixed — the batch emptied, was archived, expired, or stock went
above the threshold.

**I acknowledged an alert but it is back.**
Acknowledging silences that condition for 24 hours. If it comes back sooner, the
situation changed (different batch or different quantity), which is a new alert.

**Why can't I remove a batch?**
It still holds units. Record an issue, discard, expiry or correction to reach 0
first.

**The expiry date won't save.**
Past dates are refused. If the batch already expired, the date is kept as it is —
use **Mark expired** instead.

---

# اردو — بلڈ بینک کے لیے رہنمائی

## 1۔ لاگ اِن

ادارے کا ای میل اور پاس ورڈ درج کر کے **Log in** دبائیں۔ کامیابی پر آپ **Dashboard**
(`/bank`) پر پہنچیں گے۔ اگر تنظیم ابھی زیرِ التوا یا مسترد ہے تو آپ کو حیثیت کا صفحہ
دکھے گا؛ منتظم سے رابطہ کریں۔

## 2۔ ڈیش بورڈ اور انتباہات

اوپر بینک کا نام، **Verified** نشان اور **Alerts (n)** نظر آتا ہے۔ ہر انتباہ میں
بتایا جاتا ہے کہ کون سی شے کی میعاد قریب ہے یا ذخیرہ کم ہے۔

- **Open batch** سے متعلقہ بیچ کھلیں۔
- **Acknowledge** دبانے سے انتباہ 24 گھنٹے کے لیے خاموش ہو جاتا ہے۔
- مسئلہ حل ہونے پر انتباہ خود غائب ہو جاتا ہے۔

## 3۔ انوینٹری کی فہرست (`/bank/inventory`)

ہر قطار ایک **بیچ** ہے: بلڈ گروپ، **بیچ** (`#1C61B494` جیسا حوالہ)، کمپوننٹ،
**دستیاب**، **محفوظ**، حیثیت اور میعاد۔

صرف **منظور شدہ**، میعاد سے پہلے اور غیر محفوظ یونٹس *دستیاب* شمار ہوتے ہیں۔ موبائل
پر یہی معلومات کارڈ کی صورت میں دکھتی ہیں۔ **+ Add batch** فہرست کے نیچے ہے۔

## 4۔ نیا بیچ شامل کرنا

1. بلڈ گروپ اور کمپوننٹ منتخب کریں۔
2. یونٹس درج کریں (مکمل عدد، منفی نہیں)۔
3. جانچ کی حیثیت منتخب کریں۔
4. میعاد کی تاریخ درج کریں — ماضی کی تاریخ قبول نہیں ہوگی۔
5. **Save batch** دبائیں۔

غلط خانے کے نیچے پیغام آئے گا اور کچھ محفوظ نہیں ہوگا۔

## 5۔ بیچ میں ترمیم یا منظوری

بیچ کھول کر **Edit batch** دبائیں۔ ہر تبدیلی حرکات کی تاریخ میں `Correction` کے
طور پر درج ہوتی ہے، اور حیثیت کی تبدیلی بھی دکھائی جاتی ہے۔ **زیرِ جانچ** بیچ کو
**منظور** کرنے کے بعد ہی وہ دستیاب شمار ہوتا ہے۔

## 6۔ اسٹاک کم کرنا

بیچ کھولیں → **Record a change**:

- **Issue units** — ہسپتال کو یونٹس بھیجنا (`Issued −N`)
- **Discard units** — ضائع یونٹس (`Discarded −N`)
- **Mark expired** — میعاد ختم (`Expired −N`)
- **Correct quantity** — غلط تعداد درست کرنا (`Correction ±N`، وجہ لازمی)

کوئی ریکارڈ حذف نہیں ہوتا؛ بیچ کی پوری تاریخ محفوظ رہتی ہے۔

## 7۔ محفوظ (Reservations)

بیچ کے صفحے پر **Reservations** میں یونٹس اور مدت (طے شدہ 6 گھنٹے) درج کر کے
**Reserve units** دبائیں۔ *دستیاب* کم اور *محفوظ* زیادہ ہو جاتا ہے۔ **Release** سے
محفوظ کرنا ختم ہو جاتا ہے، اور مدت پوری ہونے پر خود بھی ختم ہو جاتا ہے۔

## 8۔ دوسرے بلڈ بینک کو منتقلی

**Transfer out** → وصول کرنے والا تصدیق شدہ بلڈ بینک منتخب کریں → یونٹس اور نوٹ درج
کریں → **Confirm**۔ آپ کے بیچ سے یونٹس کم ہوں گے اور تاریخ میں
`Transferred out −N` اور **To <بینک>** درج ہوگا۔ وصول کرنے والا بینک اپنا آنے والا
بیچ خود شامل کرتا ہے؛ واصل خود اسٹاک منتقل نہیں کرتا۔

## 9۔ بیچ فہرست سے ہٹانا

جب بیچ میں **0 یونٹس** رہ جائیں تو **Remove from list** ظاہر ہوتا ہے۔ ہٹانے سے بیچ
فہرست سے غائب ہو جاتا ہے مگر اس کی تاریخ محفوظ رہتی ہے۔ یونٹس موجود ہوں تو بیچ نہیں
ہٹایا جا سکتا۔

## 10۔ ترتیبات (`/bank/settings`)

- **کم ذخیرے کی حد** — ہر بلڈ گروپ اور کمپوننٹ کے لیے۔ خانہ خالی چھوڑیں تو طے شدہ
  **5** لاگو ہوگا۔
- **میعاد کی وارننگ کی زمانیں** — پلیٹلیٹس 2، مکمل خون 7، سرخ خلیے 7، پلازما 30 دن۔
- **SMS انتباہات** — نشان لگائیں تو پیغام رسانی کی سہولت موجود ہونے پر SMS بھی آئے گا۔
- **Save settings** — تبدیلیاں فوراً لاگو ہوتی ہیں۔

## 11۔ زبان اور اطلاعات

گھنٹی سے اطلاعات کھلیں (`/notifications`)۔ زبان کا بٹن پوری ایپ کو اردو یا انگریزی
میں بدل دیتا ہے؛ اردو دائیں سے بائیں پڑھی جاتی ہے۔

## 12۔ عام سوالات

**بیچ دستیاب کیوں نہیں؟** — منظور شدہ نہیں، میعاد ختم، تمام یونٹس محفوظ، یا ادارہ
تصدیق شدہ نہیں۔

**دستیاب تعداد درج تعداد سے کم کیوں؟** — کچھ یونٹس محفوظ ہیں:
*دستیاب = یونٹس − فعال محفوظ*۔

**انتباہ خود کیوں غائب ہو گیا؟** — مسئلہ حل ہو گیا (بیچ خالی، محفوظ شدہ، میعاد ختم،
یا ذخیرہ حد سے بڑھ گیا)۔

**بیچ ہٹا کیوں نہیں سکتا؟** — ابھی یونٹس موجود ہیں؛ پہلے تعداد صفر کریں۔

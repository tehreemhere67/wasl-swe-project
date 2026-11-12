# Getting Started — run Wasl on your own laptop

This guide assumes you have never run a Node.js project before. Follow it top to bottom;
every step tells you what you should see when it worked.

> **What you are starting:** a website that runs on *your* computer. Nothing is uploaded,
> nothing costs money, and it does not need a database server — the database is created
> automatically inside the project folder the first time you seed it.

---

## Step 0 — what you need

| Thing | Why | How much |
| --- | --- | --- |
| Windows laptop | this guide is written for Windows + PowerShell | — |
| Internet | to download Node.js and the project's packages **once** | ~700 MB of downloads in total |
| Free disk space | packages + build cache | at least **1.5 GB free** |
| ~15 minutes | mostly waiting for downloads | — |

Check free space: open **File Explorer → This PC** and look at the C: drive. If it is red, empty
the Recycle Bin first.

---

## Step 1 — install Node.js

Node.js is the engine that runs the website. You only install it once per laptop.

1. Open <https://nodejs.org> in your browser.
2. Download the **LTS** version for Windows (the big green button).
3. Run the installer. Click **Next** through everything.
   - **Important:** leave the **"Add to PATH"** option checked (it is on by default).
4. Finish and **restart** any open PowerShell/terminal windows — they will not see Node until reopened.

**Check it worked.** Open **PowerShell** (press `Win`, type `powershell`, press Enter) and type:

```powershell
node -v
npm -v
```

You should see two version numbers, e.g. `v24.x.x` and `11.x.x`.
If you see "not recognized", the PATH option was missed → reinstall Node and keep it checked.

---

## Step 2 — install pnpm

`pnpm` is a package manager — it downloads the libraries the project needs.

1. In the same PowerShell window:

```powershell
npm install -g pnpm
pnpm -v
```

2. `pnpm -v` should print a version number (e.g. `11.x.x`). If it says `pnpm` is not recognized,
   close PowerShell, open it again and run `pnpm -v` (the PATH updated).

3. **If PowerShell blocks the command** with "running scripts is disabled", run this once,
   then reopen PowerShell and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

   (Alternative if you cannot install globally: `corepack enable` also provides pnpm.)

---

## Step 3 — go to the project folder

The project lives in the `wasl` sub-folder of your **SWE project** folder:

```powershell
cd "C:\Users\tehreem\Desktop\swe project\wasl"
```

Check you are in the right place — this should list files like `package.json` and `README.md`:

```powershell
dir
```

---

## Step 4 — install the project's libraries (once)

```powershell
pnpm install
```

This takes **2–5 minutes** and downloads a few hundred MB. You will see a progress bar and
finally `Done`. You only ever need to run this again if `package.json` changes.

**If it stops with "disk full"** → free space (Recycle Bin, Downloads) and run `pnpm install` again.

---

## Step 5 — create the database and demo accounts (once)

```powershell
pnpm db:seed
```

This creates the local database inside `.data\` and prints a table of demo accounts.
You should see the demo accounts list at the end.

- It is **safe to run twice**.
- If you ever want a clean slate: `pnpm db:reset` then `pnpm db:seed`.

---

## Step 6 — start the website

```powershell
pnpm dev
```

Wait for `Ready in ...` and `Local: http://localhost:3000`.
Now open your browser and go to **<http://localhost:3000>**.

Leave this PowerShell window open — it is the server. **To stop the website press `Ctrl + C`**
in that window (or just close the window).

> Opening the site the first time compiles each page, so it can feel slow for ~10 seconds per
> page. After that it is fast. This is normal in development mode.

---

## Step 7 — log in and click around (a 5-minute demo script)

Use these accounts (created by `pnpm db:seed`):

| Role | Login | Password |
| --- | --- | --- |
| **Administrator** | `admin@wasl.pk` | `WaslAdmin#2026` |
| Verified hospital | `hospital@demo.wasl` | `WaslDemo#2026` |
| Verified blood bank | `bank@demo.wasl` | `WaslDemo#2026` |
| Verified organiser | `organizer@demo.wasl` | `WaslDemo#2026` |
| Pending hospital | `pending@demo.wasl` | `WaslDemo#2026` |
| Rejected organisation | `rejected@demo.wasl` | `WaslDemo#2026` |
| Donor | `+923009876543` | `WaslDemo#2026` |

Demo order that shows off Member 1's work:

1. **Not logged in:** open `http://localhost:3000` → landing/login page (G-01).
   Click **Register organization** → fill the form, attach any small image/PDF as the licence →
   **Submit**. You are now signed in on the **account status** screen (G-04) showing *Pending*.
2. **Log out**, then log in as **admin** → you land on the administrator area. Open
   **Verify organizations** (A-02) → your new registration is in the queue → **Approve** it.
3. **Log out**, log in as the account you registered with → it now lands in its operational area
   instead of the status screen.
4. Log in as the **hospital** → open any page → click the language button in the header
   (**EN ⇄ اردو**) → the whole app flips to Urdu, right-to-left.
5. On any page, click the **bell** → notification centre (G-05). Click the **circle avatar** →
   profile menu → **Log out**.
6. Try to break it: as the hospital, type `/admin/verifications` in the address bar → you are
   bounced back to the hospital area. As `pending@demo.wasl`, every operational page sends you
   to the status screen.

### One-time passcodes (donor signup / forgot password)

No SMS provider is configured, so the code is not texted. Get it from **any** of these:

- The green/blue box under the code field (development notice), **or**
- Open <http://localhost:3000/dev/outbox> in another tab, **or**
- Read it in the PowerShell window running the server (`[sms:dev] to=... body=...`).

---

## Useful commands (when the server is stopped, or in a second PowerShell window)

| Command | What it does |
| --- | --- |
| `pnpm dev` | start the website on <http://localhost:3000> |
| `pnpm test` | run the automated test suite (should say 189 pass, 0 fail) |
| `pnpm typecheck` | check the code for type errors |
| `pnpm build` | make the production build (what a real deployment uses) |
| `pnpm start` | serve the production build (run `pnpm build` first) |
| `pnpm db:seed` | create/repair the local database + demo accounts |   
| `pnpm db:reset` | delete the local database (then run `pnpm db:seed`) |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `node` / `npm` not recognized | Reinstall Node.js with "Add to PATH" checked, then reopen PowerShell. |
| `pnpm` not recognized | `npm install -g pnpm`, then reopen PowerShell. |
| `pnpm : running scripts is disabled` | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, reopen PowerShell. |
| `Cannot find module 'styled-jsx/package.json'` | Your `node_modules` was installed with a symlinked layout. Delete `node_modules`, keep `pnpm-workspace.yaml` (it forces a flat layout), run `pnpm install` again. |
| Port 3000 already in use | `pnpm exec next dev -p 3001` then open <http://localhost:3001>. |
| Page shows "Application error" | Stop the server, run `pnpm db:reset`, `pnpm db:seed`, `pnpm dev`. |
| Login says "too many failed attempts" | You are locked for 15 minutes by design. Use another demo account, or reset the database (`pnpm db:reset` + `pnpm db:seed`). |
| Everything looks unstyled | The Tailwind styles did not compile — stop the server, `pnpm install`, `pnpm dev`. |
| OTP code never arrives | Expected: no SMS provider. Use `/dev/outbox` or the code shown on the form. |

---

## Optional — use a real PostgreSQL server instead of the local one

The app uses **embedded PostgreSQL** (PGlite) by default so you need no database server.
To point it at a real PostgreSQL (e.g. a free Neon/Supabase database, or a local install):

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL=postgresql://user:password@host:5432/wasl`.
3. Run `pnpm db:seed` once (creates the same schema). No code changes.

This is also how the team can share **one** demo database instead of each laptop having its own.

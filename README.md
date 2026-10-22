# Dangi Samaj Portal — setup guide

A web app (PWA) to register Dangi community members area by area:
**State → District → Block → Panchayat → Village**.

**Starting with Gaya:** all 24 blocks (grouped under the 4 subdivisions) and 320 gram panchayats are loaded. Gaya is pre-selected on the form. Members choose their block and panchayat and **type their village name**. The box suggests names others in that panchayat have already used, so spellings stay consistent.

- **Members** fill a Hindi + English form from a link. Nothing needs to be installed.
- **Coordinators** log in with a code sent to their email. Each one sees only their own area (district, block or panchayat).
- **You (super admin)** see everything, appoint coordinators, and add areas.
- **Messaging:** filter any area, then copy the numbers, download them for Excel, save them to phone contacts (for WhatsApp broadcast), or open WhatsApp one by one with the message already typed.

It runs on **Supabase** (database + login) and any free static host. It works for all of India: add states as you grow.

---

## Where the app lives

- **Live app:** https://dangisamaj.github.io (repository `dangisamaj/dangisamaj.github.io`). It's a single-file build of this source.
- **This repository** holds the source. `app.html` is the app's entry page. The `index.html` here only sends visitors of the old address (sidharth51107.github.io/dangi-samaj) to the live app.

## What's in the folder

| File | What it is |
|---|---|
| `app.html`, `css/`, `js/` | The app (open `app.html`) |
| `js/config.js` | **The only file you edit**: your Supabase keys and app name |
| `supabase/schema.sql` | Creates the tables and the access rules |
| `supabase/seed_bihar.sql` | Adds Bihar and its 38 districts |
| `supabase/seed_gaya.sql` | Adds Gaya's 24 blocks (with subdivision) and 320 panchayats (with village counts) |
| `tools/data/gaya_panchayats.csv` | The same Gaya list as a spreadsheet, for checking or correcting |
| `supabase/seed_booths_imamganj.sql` | Adds the 403 polling booths of 227-Imamganj Vidhan Sabha (Dumaria, Imamganj and Banke Bazar blocks) and Imamganj Nagar Panchayat |
| `tools/data/imamganj_vs_booths.csv` | The same booth list as a spreadsheet, with the panchayat each booth was matched to |
| `tools/lgd_to_sql.py` | Converts the official village list into import files |
| `manifest.webmanifest`, `sw.js`, `icons/` | Let people add the app to their home screen and open the form offline |

If `config.js` has no Supabase URL, the app runs in **demo mode** with sample data. Open `app.html` to try it.

---

## Step 1: Create the database (10 minutes)

1. Go to **supabase.com** and sign up (free).
2. Click **New project**. Name it `dangi-samaj`, set a strong database password, and choose region **Mumbai (ap-south-1)**.
3. When the project is ready, open **SQL Editor → New query**.
4. Paste the whole of `supabase/schema.sql` and press **Run**.
5. In a new query, paste `supabase/seed_bihar.sql` and press **Run**. Then do the same with `supabase/seed_gaya.sql`, and then `supabase/seed_booths_imamganj.sql`.
6. Make yourself super admin. Change the email and run:
   ```sql
   insert into public.coordinators(email, full_name, role)
   values ('your-email@gmail.com', 'Sidharth', 'super_admin');
   ```

## Step 2: Set up the login emails

1. **Authentication → Sign In / Providers**: make sure **Email** is turned on.
2. **Authentication → Email Templates → Magic Link**: add this line so coordinators receive a 6-digit code they can type into the app:
   ```
   <p>Your login code: <b>{{ .Token }}</b></p>
   ```
3. **Authentication → URL Configuration**: set **Site URL** to your app's link (from Step 5).
4. Supabase's built-in email service sends only a few emails per hour. Before you add many coordinators, connect your own email sender under **Project Settings → Authentication → SMTP**. Brevo and Zoho both offer free plans.

## Step 3: Connect the app

1. In Supabase, open **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Paste them into `js/config.js`:
   ```js
   SUPABASE_URL: 'https://xxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   ```
   The anon key is safe to put in the app. The database rules decide what anyone can see.

## Districts without a block list (Madhya Pradesh, Rajasthan, most of Bihar)

- **Madhya Pradesh** (55 districts) and **Rajasthan** (41 districts) are loaded (`supabase/seed_mp_rajasthan.sql`).
- **Jharkhand** (24), **Uttar Pradesh** (75), **Karnataka** (31), **Gujarat** (34) and **West Bengal** (23) are loaded too (`supabase/seed_more_states.sql`).
- **Where a district has no block list yet**, the form asks members to **type** their block, panchayat and village. As people register, the boxes suggest names others in that district already typed, so spellings stay consistent.
- **On the dashboard**, those districts drill down by the typed names: block, then panchayat, then village.
- **When an official list is added later**, members of that district must pick from it. Earlier typed entries stay as they are.
- **Jehanabad** has its full list (`supabase/seed_jehanabad.sql`): 7 blocks and 93 panchayats, plus Jehanabad Nagar Parishad (33 wards) and Makhdumpur Nagar Panchayat (19 wards).

## Polling booths

Booths are loaded for **227-Imamganj Vidhan Sabha**: 403 booths across Dumaria (1–115), Imamganj (116–289) and Banke Bazar (290–403). Each booth is linked to its panchayat.

- **On the form:** after choosing a panchayat in these blocks, members see its booths and can pick theirs, or choose "Don't know". Picking a booth fills in the village from the polling-station name if the village box is empty.
- **Dashboard:** in these areas, switch between **By panchayat / By village** and **By polling booth**. The booth view shows members per booth, and tapping a booth lists its members. "Booths with members" shows coverage, for example *41 of 174*.
- **Members and messaging:** filter by booth number to view or message one booth.
- **Imamganj town:** "Imamganj Nagar Panchayat" is added under Imamganj block (20 booths: 136–147 and 237–244). Town residents choose it and type their ward or mohalla.
- **Booths for other assemblies:** send the list in the same layout (booth number and name, grouped by panchayat and block) and it can be loaded the same way.

## Step 4: Villages and missing panchayats

**Villages:** nothing to load. Members type their village under their panchayat. The dashboard groups them by village name and shows how many of each panchayat's villages have been reached (for example *3 of 20*). If one village appears under two spellings, a coordinator opens it and corrects the name with **Edit**.

**Missing panchayats:** your Excel sheet lists 332 panchayats in Gaya, but the CSV has 320. Twelve are missing: Bodh Gaya (3), Imamganj (2), Khizarsarai (2), Wazirganj (2), Dobhi (1), Fatehpur (1) and Tekari (1). As super admin, open **Locations → Bihar → Gaya → the block** and add each missing one by name.

**Other districts later:** send the same kind of block / panchayat list and it can be loaded the same way. For whole states, `tools/lgd_to_sql.py` converts the government's LGD village list into import files (`python3 tools/lgd_to_sql.py file.csv --state Bihar`), which you paste into SQL Editor.

## Step 5: Put the app online (free)

The easiest option is **Netlify Drop**. Go to **app.netlify.com/drop** and drag the whole `dangi-samaj` folder onto the page. You get a link like `https://dangi-samaj.netlify.app`, and you can rename it in site settings.

Since you already use GitHub, you can instead push the folder to a repository and turn on **Settings → Pages**.

Use the link as the Site URL in Step 2.

## Step 6: Start collecting

1. Log in with your email, then go to **Coordinators** and appoint coordinators by email: one for Gaya district, then block coordinators (blocks are grouped by subdivision), then panchayat coordinators.
2. Share the main link on WhatsApp groups. Members open it, pick their village, and register. New entries show as **Pending** until a coordinator verifies them.
3. Coordinators doing door-to-door entry use **Add member**, which saves records as verified. Ask them to open the link in Chrome and choose **Add to Home screen**. The form then opens even without signal, and entries saved offline are sent when the internet returns.

---

## Who can see what

| | Register | See members | Verify / edit | Delete | Appoint coordinators | Add areas |
|---|---|---|---|---|---|---|
| Public (no login) | ✓ | — | — | — | — | — |
| Panchayat coordinator | ✓ | own panchayat | own panchayat | — | — | villages in own panchayat |
| Block coordinator | ✓ | own block | own block | — | — | villages in own block |
| District coordinator | ✓ | own district | own district | — | — | villages in own district |
| Super admin | ✓ | everything | everything | ✓ | ✓ | everything |

These rules are enforced by the database itself, so they hold even if someone tampers with the app.

## Sending messages: what works at scale

- **Up to a few hundred people:** download the contacts file (.vcf), import it to your phone, and create a WhatsApp **Broadcast list**. Broadcasts reach only people who have saved your number. The one-by-one WhatsApp button suits small groups.
- **Thousands of people:** use **WhatsApp Business API** (through providers such as Interakt, AiSensy or Gupshup) or **bulk SMS**. In India, bulk SMS needs a DLT registration and approved message templates. Use **Copy numbers** or the Excel download to load contacts into these services.
- Sending a lot from a personal WhatsApp number to people who haven't saved it can get the number blocked.

## Growing to all of India

- Add another state by importing its LGD file, or add it in **Locations** (super admin).
- Appoint **State coordinators** for each state. They see their whole state.
- The same link works everywhere. People pick their own state on the form.

## Later: Play Store app

This web app can be wrapped as an Android app without rewriting it. Use **Bubblewrap / Trusted Web Activity** (the simplest option) or **Capacitor**. The same code and database keep working.

## Good practice

- **Backups:** download the full Excel from **Send message** every month and keep it safe. Paid Supabase plans also have automatic daily backups.
- **Free plan:** Supabase pauses free projects after about a week with no activity. Open the app now and then, or move to a paid plan once data collection is running. Check Supabase's pricing page for current limits.
- **Privacy:** every member ticks a consent box. If anyone asks to be removed, the super admin can delete their record. Appoint only people you trust as coordinators, and pause or remove them when they step down.
- **Spam:** if the public form starts getting fake entries, add a captcha (Cloudflare Turnstile) to the form.

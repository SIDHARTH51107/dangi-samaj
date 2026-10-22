-- =====================================================================
--  Update of 22 Oct 2026 — run once in Supabase → SQL Editor.
--  1. Re-applies schema.sql (safe to repeat) — paste schema.sql FIRST,
--     then this file. (Combined file used for the live update.)
--  2. Adds Madhya Pradesh and Rajasthan with their districts.
--  3. Renames Tarwan panchayat (Banke Bazar) to Tandwa.
--  4. Fills block / panchayat names for members already registered.
-- =====================================================================
update public.locations p set name = 'Tandwa'
from public.locations b
where p.level = 'panchayat' and p.name = 'Tarwan' and p.parent_id = b.id and b.level = 'block' and b.name = 'Banke Bazar';

update public.members set place_id = place_id;   -- re-runs the trigger: fills block_name / panchayat_name

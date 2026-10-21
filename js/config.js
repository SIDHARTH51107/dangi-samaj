/* =====================================================================
   SETTINGS — the only file you need to edit.
   Leave SUPABASE_URL empty to run the app in DEMO mode (sample data).
   Paste your values from Supabase → Project Settings → API (see README).
   ===================================================================== */
window.APP_CONFIG = {
  APP_NAME: 'दांगी समाज',            // shown in the header (Hindi)
  APP_NAME_EN: 'Dangi Samaj Portal',  // shown under it (English)

  SUPABASE_URL: 'https://fioqdttoqaevcnhqzwly.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpb3FkdHRvcWFldmNuaHF6d2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDAyODUsImV4cCI6MjEwODE3NjI4NX0.lPNysdWlpgRcBdwVdWz2b0Q73uGBHI9WtDJbDgLGWEM',  // "anon public" key: safe in the app, the database rules protect the data

  DEFAULT_STATE: 'Bihar',             // pre-selected on the registration form
  DEFAULT_DISTRICT: 'Gaya',           // pre-selected too (people can still change it)
  COUNTRY_CODE: '91'                  // used for WhatsApp links and contact export
};

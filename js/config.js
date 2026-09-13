/* ============================================================
   EDIT THIS FILE — it's the only file you need to personalize
   to get the site running. See README.md for where each value
   comes from.
   ============================================================ */

const CONFIG = {
  // --- Names shown around the site ---
  yourName: "Cade",
  herName: "Claudia",

  // --- Supabase project (README step 2) ---
  // Project Settings -> API in your Supabase dashboard.
  supabaseUrl: "https://ozhdwdsbvffbkenfkxmt.supabase.co",
  supabaseAnonKey: "sb_publishable_IthSeTfWlewpJgE-wEWXNw_RNT1uqST",

  // --- Google Calendar (README step 3) ---
  // Create 3 calendars (yours, hers, shared), make each "public",
  // then paste each calendar's ID here (Settings -> Integrate calendar).
  calendars: {
    timezone: "America/New_York", // e.g. "America/New_York", "Europe/London"
    yours: {
      id: "your-calendar-id@group.calendar.google.com",
      color: "2952A3", // hex without '#', pick from Google's palette (see README)
      label: "Cade's",
    },
    hers: {
      id: "her-calendar-id@group.calendar.google.com",
      color: "B23A2E",
      label: "Claudia's",
    },
    shared: {
      id: "shared-calendar-id@group.calendar.google.com",
      color: "6E7F5C",
      label: "Ours",
    },
  },
};

// Loaded after config.js and after the Supabase UMD bundle (see <script> tags
// in each HTML page). Exposes a ready-to-use `supabase` client + a helper
// that shows a banner if the project hasn't been configured yet.

const isConfigured =
  CONFIG.supabaseUrl && !CONFIG.supabaseUrl.includes("YOUR-PROJECT-REF") &&
  CONFIG.supabaseAnonKey && !CONFIG.supabaseAnonKey.includes("YOUR-ANON");

let supabaseClient = null;
if (isConfigured) {
  supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
}

function requireConfigOrWarn(containerId) {
  if (isConfigured) return true;
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML =
      '<div class="notice">This page needs your Supabase project details. Open <code>js/config.js</code> and fill in <code>supabaseUrl</code> and <code>supabaseAnonKey</code> — see README.md step 2.</div>' +
      el.innerHTML;
  }
  return false;
}

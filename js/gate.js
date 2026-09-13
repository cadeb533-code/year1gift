// A front-door lock, not a vault: this only stops someone who stumbles
// onto the URL from seeing the page. Since it's plain client-side JS,
// it can't hide anything from someone who goes looking for it. See the
// README's privacy note for what this does and doesn't protect.
(function () {
  const STORAGE_KEY = "am-unlocked";
  if (localStorage.getItem(STORAGE_KEY) === "yes") return;
  if (!CONFIG.sitePasswordHash || CONFIG.sitePasswordHash.includes("PASTE_YOUR_HASH")) {
    // Not set up yet — don't lock people out accidentally.
    return;
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const overlay = document.createElement("div");
  overlay.id = "gate-overlay";
  overlay.innerHTML = `
    <div class="gate-card">
      <div class="stamp" style="position:static; transform:rotate(-4deg); margin:0 auto 14px;">PRIVATE</div>
      <h2>This one's just for us.</h2>
      <form id="gate-form">
        <input id="gate-password" type="password" placeholder="Password" autocomplete="off">
        <button class="btn" type="submit">Enter</button>
      </form>
      <p id="gate-error" class="gate-error"></p>
    </div>
  `;
  document.documentElement.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const input = overlay.querySelector("#gate-password");
  input.focus();

  overlay.querySelector("#gate-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const hash = await sha256(input.value);
    if (hash === CONFIG.sitePasswordHash) {
      localStorage.setItem(STORAGE_KEY, "yes");
      overlay.remove();
      document.body.style.overflow = "";
    } else {
      overlay.querySelector("#gate-error").textContent = "That's not it — try again.";
      input.value = "";
      input.focus();
    }
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.getElementById("board");
  const formEl = document.getElementById("note-form");
  const authorEl = document.getElementById("note-author");
  const messageEl = document.getElementById("note-message");
  const photoEl = document.getElementById("note-photo");
  const statusEl = document.getElementById("board-status");

  authorEl.innerHTML = `
    <option value="${CONFIG.yourName}">${CONFIG.yourName}</option>
    <option value="${CONFIG.herName}">${CONFIG.herName}</option>
  `;

  if (!requireConfigOrWarn("board-page")) return;

  const PIN_COLORS = ["#b23a2e", "#c1922f", "#6e7f5c", "#263449"];
  const pinColorFor = (author) =>
    author === CONFIG.yourName ? "#263449"
    : author === CONFIG.herName ? "#b23a2e"
    : PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)];

  function renderNote(note) {
    const el = document.createElement("div");
    el.className = "note";
    el.dataset.id = note.id;
    el.style.left = `${note.x ?? Math.random() * 60 + 5}%`;
    el.style.top = `${note.y ?? Math.random() * 60 + 5}%`;
    el.style.transform = `rotate(${note.rotation ?? (Math.random() * 6 - 3)}deg)`;
    el.style.zIndex = 1;

    el.innerHTML = `
      <div class="pin" style="background:${pinColorFor(note.author)}"></div>
      <button class="del" title="Remove note">✕</button>
      ${note.image_url ? `<img src="${note.image_url}" alt="">` : ""}
      <div class="note-text"></div>
      <div class="author">— ${note.author}</div>
    `;
    el.querySelector(".note-text").textContent = note.message || "";

    el.querySelector(".del").addEventListener("click", async (e) => {
      e.stopPropagation();
      el.remove();
      await supabaseClient.from("notes").delete().eq("id", note.id);
    });

    makeDraggable(el, note.id);
    boardEl.appendChild(el);
  }

  function makeDraggable(el, id) {
    let dragging = false;
    let offsetX = 0, offsetY = 0;

    const start = (clientX, clientY) => {
      dragging = true;
      el.style.zIndex = 10;
      const rect = el.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    };
    const move = (clientX, clientY) => {
      if (!dragging) return;
      const boardRect = boardEl.getBoundingClientRect();
      let xPct = ((clientX - offsetX - boardRect.left) / boardRect.width) * 100;
      let yPct = ((clientY - offsetY - boardRect.top) / boardRect.height) * 100;
      xPct = Math.max(0, Math.min(88, xPct));
      yPct = Math.max(0, Math.min(85, yPct));
      el.style.left = `${xPct}%`;
      el.style.top = `${yPct}%`;
    };
    const end = async () => {
      if (!dragging) return;
      dragging = false;
      el.style.zIndex = 1;
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      await supabaseClient.from("notes").update({ x, y }).eq("id", id);
    };

    el.addEventListener("mousedown", (e) => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", end);

    el.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("touchend", end);
  }

  async function loadNotes() {
    const { data, error } = await supabaseClient
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      statusEl.textContent = `Couldn't load notes: ${error.message}`;
      return;
    }
    boardEl.innerHTML = "";
    (data || []).forEach(renderNote);
  }

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Pinning…";
    const author = authorEl.value;
    const message = messageEl.value.trim();
    const file = photoEl.files[0];
    if (!message && !file) {
      statusEl.textContent = "Write something or attach a photo first.";
      return;
    }

    let image_url = null;
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error: uploadError } = await supabaseClient
        .storage.from("note-photos")
        .upload(path, file);
      if (uploadError) {
        statusEl.textContent = `Photo upload failed: ${uploadError.message}`;
        return;
      }
      const { data: pub } = supabaseClient.storage.from("note-photos").getPublicUrl(path);
      image_url = pub.publicUrl;
    }

    const { error } = await supabaseClient.from("notes").insert({
      author,
      message,
      image_url,
      x: Math.random() * 60 + 5,
      y: Math.random() * 55 + 5,
      rotation: Math.random() * 6 - 3,
    });

    if (error) {
      statusEl.textContent = `Couldn't save note: ${error.message}`;
      return;
    }
    formEl.reset();
    statusEl.textContent = "Pinned!";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });

  supabaseClient
    .channel("notes-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, loadNotes)
    .subscribe();

  loadNotes();
});

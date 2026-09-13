document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("timeline-list");
  const formEl = document.getElementById("timeline-form");
  const authorEl = document.getElementById("timeline-author");
  const titleEl = document.getElementById("timeline-title");
  const dateEl = document.getElementById("timeline-date-input");
  const captionEl = document.getElementById("timeline-caption");
  const descriptionEl = document.getElementById("timeline-description");
  const photoEl = document.getElementById("timeline-photo");
  const statusEl = document.getElementById("timeline-status");

  const modal = document.getElementById("timeline-modal");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalDescription = document.getElementById("modal-description");
  const modalAuthor = document.getElementById("modal-author");
  const modalClose = document.getElementById("modal-close");

  authorEl.innerHTML = `
    <option value="${CONFIG.yourName}">${CONFIG.yourName}</option>
    <option value="${CONFIG.herName}">${CONFIG.herName}</option>
  `;

  if (!requireConfigOrWarn("timeline-page")) return;

  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  function openModal(event) {
    modalImg.style.display = event.image_url ? "block" : "none";
    if (event.image_url) modalImg.src = event.image_url;
    modalTitle.textContent = event.title;
    modalDate.textContent = formatDate(event.event_date);
    modalDescription.textContent = event.description || "";
    modalAuthor.textContent = event.author ? `— added by ${event.author}` : "";
    modal.hidden = false;
  }
  modalClose.addEventListener("click", () => (modal.hidden = true));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.hidden = true;
  });

  function renderEvent(event) {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.dataset.id = event.id;

    const rotation = (Math.random() * 6 - 3).toFixed(1);

    item.innerHTML = `
      <div class="timeline-date">${formatDate(event.event_date)}</div>
      <div class="polaroid" style="transform: rotate(${rotation}deg)">
        <div class="pushpin"></div>
        <button class="del" title="Remove this moment">✕</button>
        ${event.image_url ? `<img src="${event.image_url}" alt="">` : ""}
        <div class="polaroid-title"></div>
        <div class="polaroid-caption"></div>
      </div>
    `;
    item.querySelector(".polaroid-title").textContent = event.title || "";
    item.querySelector(".polaroid-caption").textContent = event.caption || "";

    item.querySelector(".polaroid").addEventListener("click", (e) => {
      if (e.target.closest(".del")) return;
      openModal(event);
    });
    item.querySelector(".del").addEventListener("click", async (e) => {
      e.stopPropagation();
      item.remove();
      await supabaseClient.from("timeline_events").delete().eq("id", event.id);
    });

    listEl.appendChild(item);
  }

  async function loadEvents() {
    const { data, error } = await supabaseClient
      .from("timeline_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (error) {
      statusEl.textContent = `Couldn't load the timeline: ${error.message}`;
      return;
    }
    listEl.innerHTML = "";
    (data || []).forEach(renderEvent);
  }

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const event_date = dateEl.value;
    if (!title || !event_date) {
      statusEl.textContent = "A title and a date are both needed.";
      return;
    }
    statusEl.textContent = "Pinning it to the board…";

    let image_url = null;
    const file = photoEl.files[0];
    if (file) {
      const path = `timeline-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
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

    const { error } = await supabaseClient.from("timeline_events").insert({
      title,
      event_date,
      caption: captionEl.value.trim(),
      description: descriptionEl.value.trim(),
      image_url,
      author: authorEl.value,
    });

    if (error) {
      statusEl.textContent = `Couldn't save that: ${error.message}`;
      return;
    }
    formEl.reset();
    statusEl.textContent = "Added!";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });

  supabaseClient
    .channel("timeline-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, loadEvents)
    .subscribe();

  loadEvents();
});
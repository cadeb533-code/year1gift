document.addEventListener("DOMContentLoaded", () => {
  if (!requireConfigOrWarn("doodle-page")) return;

  const canvas = document.getElementById("doodle-canvas");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("doodle-clear");
  const widthEl = document.getElementById("doodle-width");
  const statusEl = document.getElementById("doodle-status");
  const swatchesEl = document.getElementById("doodle-swatches");

  const COLORS = ["#2a241d", "#b23a2e", "#263449", "#6e7f5c", "#c1922f", "#faf5ea"];
  let currentColor = COLORS[0];
  let currentWidth = () => parseInt(widthEl.value, 10);

  COLORS.forEach((c) => {
    const sw = document.createElement("button");
    sw.className = "swatch" + (c === currentColor ? " active" : "");
    sw.style.background = c;
    sw.type = "button";
    sw.addEventListener("click", () => {
      currentColor = c;
      [...swatchesEl.children].forEach((s) => s.classList.remove("active"));
      sw.classList.add("active");
    });
    swatchesEl.appendChild(sw);
  });

  let strokesCache = [];

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    redrawAll();
  }

  function drawStroke(stroke) {
    const { points, color, width } = stroke;
    if (!points || points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * devicePixelRatio;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesCache.forEach(drawStroke);
  }

  async function loadStrokes() {
    const { data, error } = await supabaseClient
      .from("doodle_strokes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      statusEl.textContent = `Couldn't load doodle: ${error.message}`;
      return;
    }
    strokesCache = data || [];
    redrawAll();
  }

  // --- drawing input ---
  let drawing = false;
  let currentPoints = [];

  function toNormalized(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  }

  function pointerDown(clientX, clientY) {
    drawing = true;
    currentPoints = [toNormalized(clientX, clientY)];
  }
  function pointerMove(clientX, clientY) {
    if (!drawing) return;
    const p = toNormalized(clientX, clientY);
    currentPoints.push(p);
    drawStroke({ points: currentPoints.slice(-2), color: currentColor, width: currentWidth() });
  }
  async function pointerUp() {
    if (!drawing) return;
    drawing = false;
    if (currentPoints.length < 2) return;
    const stroke = { points: currentPoints, color: currentColor, width: currentWidth() };
    strokesCache.push(stroke);
    const { error } = await supabaseClient.from("doodle_strokes").insert({
      points: stroke.points,
      color: stroke.color,
      width: stroke.width,
    });
    if (error) statusEl.textContent = `Couldn't save stroke: ${error.message}`;
    currentPoints = [];
  }

  canvas.addEventListener("mousedown", (e) => pointerDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", pointerUp);

  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    pointerDown(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    pointerMove(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", pointerUp);

  clearBtn.addEventListener("click", async () => {
    if (!confirm("Clear the whole doodle for both of you?")) return;
    strokesCache = [];
    redrawAll();
    await supabaseClient.from("doodle_strokes").delete().neq("id", 0);
    channel.send({ type: "broadcast", event: "clear", payload: {} });
  });

  const channel = supabaseClient.channel("doodle-room");
  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "doodle_strokes" }, (payload) => {
      // Avoid redrawing a stroke we already drew locally in this session.
      const already = strokesCache.some(
        (s) => JSON.stringify(s.points) === JSON.stringify(payload.new.points)
      );
      if (!already) {
        strokesCache.push(payload.new);
        drawStroke(payload.new);
      }
    })
    .on("broadcast", { event: "clear" }, () => {
      strokesCache = [];
      redrawAll();
    })
    .subscribe();

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  loadStrokes();
});

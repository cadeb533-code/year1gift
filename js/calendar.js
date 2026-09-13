document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("calendar-frame");
  const legend = document.getElementById("calendar-legend");
  const noticeHost = document.getElementById("calendar-page");

  const cals = CONFIG.calendars;
  const placeholderMarkers = ["your-calendar-id", "her-calendar-id", "shared-calendar-id"];
  const placeholder = [cals.yours, cals.hers, cals.shared].some(
    (c) => c && c.id && placeholderMarkers.some((marker) => c.id.includes(marker))
  );

  if (placeholder) {
    noticeHost.insertAdjacentHTML(
      "afterbegin",
      '<div class="notice">This page needs your real Google Calendar IDs. Open <code>js/config.js</code> and fill in the <code>calendars</code> section — see README.md step 3.</div>'
    );
  }

  const entries = [cals.yours, cals.hers, cals.shared];
  const params = new URLSearchParams();
  entries.forEach((c) => params.append("src", c.id));
  entries.forEach((c) => params.append("color", `#${c.color}`));
  params.set("ctz", cals.timezone);
  params.set("mode", "MONTH");
  params.set("showTitle", "0");
  params.set("showPrint", "0");
  params.set("showCalendars", "0");
  params.set("showTz", "0");

  frame.src = `https://calendar.google.com/calendar/embed?${params.toString()}`;

  legend.innerHTML = entries
    .map((c) => `<span><i style="background:#${c.color}"></i>${c.label}</span>`)
    .join("");
});

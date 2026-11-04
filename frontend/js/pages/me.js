import { api, escapeHtml, formatDate, getUser, setSession, statusClass, getToken } from "../core.js";
import { empty, toast, logout } from "../ui.js";

export function renderDashboard() {
  return `
    <div class="page-head">
      <div>
        <h1>My dashboard</h1>
        <p>Your reading snapshot</p>
      </div>
    </div>
    <div class="stats" id="meStats"></div>
    <div class="charts">
      <div class="panel">
        <h2>Current rentals</h2>
        <div id="current"></div>
      </div>
      <div class="panel">
        <h2>Genre breakdown</h2>
        <div id="genreBars"></div>
      </div>
    </div>
    <div class="panel">
      <h2>Reading history</h2>
      <div style="overflow:auto">
        <table class="table">
          <thead><tr><th>Book</th><th>Author</th><th>Status</th><th>Due</th><th>Returned</th></tr></thead>
          <tbody id="histBody"></tbody>
        </table>
      </div>
    </div>
  `;
}

export async function bindDashboard() {
  try {
    const json = await api("/rentals");
    const rentals = json.data || [];
    const counted = rentals.filter((r) => ["active", "returned", "overdue", "approved"].includes(r.status));
    const current = rentals.filter((r) => ["active", "approved", "overdue"].includes(r.status));
    const genres = {};
    counted.forEach((r) => {
      const g = r.book?.genre || "Unknown";
      genres[g] = (genres[g] || 0) + 1;
    });
    const fav = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("meStats").innerHTML = `
      <div class="stat"><div class="label">Total books rented</div><div class="value">${counted.length}</div></div>
      <div class="stat"><div class="label">Currently reading</div><div class="value">${current.length}</div></div>
      <div class="stat"><div class="label">Favorite genre</div><div class="value" style="font-size:20px">${escapeHtml(fav ? fav[0] : "—")}</div></div>
    `;
    document.getElementById("current").innerHTML = current.length
      ? current
          .map((r) => {
            const overdue = r.status === "overdue" || (r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "returned");
            return `<div class="list-card" style="margin-bottom:8px">
              <strong>${escapeHtml(r.book?.title || "Book")}</strong>
              <div class="row"><span class="muted">Due ${formatDate(r.dueDate)}</span>
              ${overdue ? `<span class="badge b-overdue">Overdue</span>` : `<span class="badge b-active">${escapeHtml(r.status)}</span>`}</div>
            </div>`;
          })
          .join("")
      : empty("You're not reading anything right now.");

    const max = Math.max(1, ...Object.values(genres));
    document.getElementById("genreBars").innerHTML = Object.keys(genres).length
      ? Object.entries(genres)
          .map(
            ([g, n]) =>
              `<div class="bar-row"><span>${escapeHtml(g)}</span><div class="bar-track"><span style="width:${(n / max) * 100}%"></span></div><span>${n}</span></div>`
          )
          .join("")
      : empty("Rent books to see genre trends.");

    document.getElementById("histBody").innerHTML = rentals.length
      ? rentals
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.book?.title || "")}</td><td>${escapeHtml(r.book?.author || "")}</td>
               <td><span class="badge ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td>
               <td>${formatDate(r.dueDate)}</td><td>${formatDate(r.returnDate)}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="muted">No history yet.</td></tr>`;
  } catch (ex) {
    document.getElementById("current").innerHTML = empty(escapeHtml(ex.message));
  }
}

export function renderProfile() {
  const user = getUser() || {};
  return `
    <div class="page-head">
      <div>
        <h1>Profile & preferences</h1>
        <p>Tell BookNexus what you like to read and configure notification channels</p>
      </div>
      <button class="btn secondary" id="logoutProfile">Logout</button>
    </div>
    <div class="panel" style="max-width:720px; margin-bottom: 24px;">
      <h2>Reader Profile</h2>
      <div class="form-grid">
        <div class="field"><label>Name</label><input id="profName" value="${escapeHtml(user.name || "")}"></div>
        <div class="field"><label>Email</label><input value="${escapeHtml(user.email || "")}" disabled></div>
        <div class="field"><label>Role</label><input value="${escapeHtml(user.role || "")}" disabled></div>
      </div>
      <div class="field"><label>Favorite genres</label><div class="chips" id="genres"></div><div class="chip-add"><input id="genreIn" placeholder="Add genre"><button class="btn sm" type="button" data-add="genres">Add</button></div></div>
      <div class="field"><label>Favorite authors</label><div class="chips" id="authors"></div><div class="chip-add"><input id="authorIn" placeholder="Add author"><button class="btn sm" type="button" data-add="authors">Add</button></div></div>
      <div class="field"><label>Favorite subjects</label><div class="chips" id="subjects"></div><div class="chip-add"><input id="subjectIn" placeholder="Add subject"><button class="btn sm" type="button" data-add="subjects">Add</button></div></div>
      <button class="btn" id="savePrefs">Save Preferences</button>
    </div>

    <div class="panel" style="max-width:720px">
      <h2>Email Notification Settings</h2>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Choose which transactional emails you receive at <strong>${escapeHtml(user.email || "")}</strong>.
      </p>

      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="prefRentalUpdates" style="margin-top: 4px;" checked>
          <div>
            <strong>Rental & Borrowing Updates</strong>
            <div style="font-size: 13px; color: #6b7280;">Notifications when borrow requests are received, accepted, ready for pickup, or returned.</div>
          </div>
        </label>

        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="prefDueReminders" style="margin-top: 4px;" checked>
          <div>
            <strong>Due Date & Overdue Reminders</strong>
            <div style="font-size: 13px; color: #6b7280;">Advance notices (48h, 24h) before books are due and overdue notices with penalty calculations.</div>
          </div>
        </label>

        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="prefAnnouncements" style="margin-top: 4px;" checked>
          <div>
            <strong>Campus Announcements & Library Hours</strong>
            <div style="font-size: 13px; color: #6b7280;">Important campus library updates, schedule changes, and semester book drives.</div>
          </div>
        </label>

        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="prefReadingUpdates" style="margin-top: 4px;" checked>
          <div>
            <strong>Reading Recommendations & Catalog Additions</strong>
            <div style="font-size: 13px; color: #6b7280;">Curated suggestions based on your courses and favorite genres.</div>
          </div>
        </label>

        <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="prefPromotional" style="margin-top: 4px;">
          <div>
            <strong>Special Programs & Book Drives</strong>
            <div style="font-size: 13px; color: #6b7280;">Optional community partner events and peer-to-peer exchanges.</div>
          </div>
        </label>

        <div style="background: #F5EFEB; border-left: 4px solid #46282A; padding: 12px; border-radius: 4px; font-size: 13px; color: #46282A; margin-top: 8px;">
          <strong>Security & Operational Notice:</strong> Account security alerts (sign-ins, password updates) and official transaction/fine payment receipts cannot be disabled for student and campus safety.
        </div>
      </div>

      <button class="btn" id="saveEmailPrefs">Save Notification Settings</button>
    </div>
  `;
}

export function bindProfile() {
  const user = getUser() || {};
  const prefs = {
    genres: [...(user.preferences?.genres || [])],
    authors: [...(user.preferences?.authors || [])],
    subjects: [...(user.preferences?.subjects || [])],
  };
  const inputs = { genres: "genreIn", authors: "authorIn", subjects: "subjectIn" };

  function paint(kind) {
    document.getElementById(kind).innerHTML = prefs[kind]
      .map((v, i) => `<span class="chip">${escapeHtml(v)} <button type="button" data-rm="${kind}:${i}">×</button></span>`)
      .join("");
  }
  ["genres", "authors", "subjects"].forEach(paint);

  // Load email preferences from backend
  api("/auth/email-preferences")
    .then((res) => {
      const ep = res.data || {};
      if (document.getElementById("prefRentalUpdates")) document.getElementById("prefRentalUpdates").checked = ep.rentalUpdates !== false;
      if (document.getElementById("prefDueReminders")) document.getElementById("prefDueReminders").checked = ep.dueReminders !== false;
      if (document.getElementById("prefAnnouncements")) document.getElementById("prefAnnouncements").checked = ep.announcements !== false;
      if (document.getElementById("prefReadingUpdates")) document.getElementById("prefReadingUpdates").checked = ep.readingUpdates !== false;
      if (document.getElementById("prefPromotional")) document.getElementById("prefPromotional").checked = ep.promotional === true;
    })
    .catch((err) => console.warn("Failed to fetch email preferences:", err.message));

  document.getElementById("logoutProfile").addEventListener("click", logout);
  document.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.add;
      const input = document.getElementById(inputs[kind]);
      const val = input.value.trim();
      if (!val) return;
      prefs[kind].push(val);
      input.value = "";
      paint(kind);
    });
  });
  document.getElementById("pageRoot")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rm]");
    if (!btn) return;
    const [kind, i] = btn.dataset.rm.split(":");
    prefs[kind].splice(Number(i), 1);
    paint(kind);
  });

  document.getElementById("savePrefs").addEventListener("click", async () => {
    try {
      const json = await api("/auth/preferences", { method: "PUT", body: { preferences: prefs } });
      const next = { ...getUser(), preferences: json.data, name: document.getElementById("profName").value.trim() || getUser()?.name };
      setSession({ ...next, token: getToken() });
      toast("Preferences saved");
    } catch (ex) {
      toast(ex.message);
    }
  });

  document.getElementById("saveEmailPrefs")?.addEventListener("click", async () => {
    try {
      const payload = {
        rentalUpdates: document.getElementById("prefRentalUpdates").checked,
        dueReminders: document.getElementById("prefDueReminders").checked,
        announcements: document.getElementById("prefAnnouncements").checked,
        readingUpdates: document.getElementById("prefReadingUpdates").checked,
        promotional: document.getElementById("prefPromotional").checked,
      };
      await api("/auth/email-preferences", { method: "PUT", body: payload });
      toast("Email notification settings saved");
    } catch (ex) {
      toast(ex.message);
    }
  });
}


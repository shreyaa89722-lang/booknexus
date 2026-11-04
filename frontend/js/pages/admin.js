import { api, escapeHtml, formatDate } from "../core.js";
import { empty, logout } from "../ui.js";

let charts = [];

export function renderAdmin() {
  return `
    <div class="page-head">
      <div>
        <h1>Admin analytics</h1>
        <p>Live usage across the BookNexus catalog</p>
      </div>
      <div class="row">
        <button class="btn secondary" id="refreshAdmin">Refresh</button>
        <button class="btn" id="adminLogout">Logout</button>
      </div>
    </div>
    <div class="stats" id="adminStats"></div>
    <div class="charts">
      <div class="chart-card"><h2>Genre distribution</h2><div id="genreBars"></div></div>
      <div class="chart-card"><h2>Rental status breakdown</h2><canvas id="statusChart"></canvas></div>
      <div class="chart-card"><h2>30-day rental trend</h2><canvas id="trendChart"></canvas></div>
      <div class="chart-card"><h2>User growth</h2><canvas id="growthChart"></canvas></div>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <h2>Most rented books</h2>
      <table class="table"><thead><tr><th>Title</th><th>Author</th><th>Rentals</th></tr></thead><tbody id="mostBody"></tbody></table>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <h2>Overdue books</h2>
      <table class="table"><thead><tr><th>Book</th><th>Renter</th><th>Contact</th><th>Due</th></tr></thead><tbody id="overdueBody"></tbody></table>
    </div>
    <div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2>Transactional Email Delivery Activity</h2>
          <p style="color:#6b7280; font-size:13px; margin:0;">Outbox queue, delivery status, and provider telemetry</p>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn sm secondary email-filter-btn" data-status="">All</button>
          <button class="btn sm secondary email-filter-btn" data-status="pending">Pending</button>
          <button class="btn sm secondary email-filter-btn" data-status="sent">Sent</button>
          <button class="btn sm secondary email-filter-btn" data-status="delivered">Delivered</button>
          <button class="btn sm secondary email-filter-btn" data-status="failed">Failed</button>
        </div>
      </div>
      <div id="emailStatsBar" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:14px;"></div>
      <div style="overflow:auto">
        <table class="table">
          <thead>
            <tr><th>Recipient</th><th>Event</th><th>Status</th><th>Provider Msg ID</th><th>Attempts</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody id="emailOutboxBody"></tbody>
        </table>
      </div>
    </div>
  `;
}

let activeEmailFilter = "";

export async function bindAdmin() {
  document.getElementById("adminLogout").addEventListener("click", logout);
  document.getElementById("refreshAdmin").addEventListener("click", () => {
    load();
    loadEmailActivity();
  });

  document.querySelectorAll(".email-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeEmailFilter = btn.dataset.status;
      loadEmailActivity();
    });
  });

  document.getElementById("emailOutboxBody")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-retry-id]");
    if (!btn) return;
    const id = btn.dataset.retryId;
    btn.disabled = true;
    btn.textContent = "Retrying...";
    try {
      await api(`/admin/emails/${id}/retry`, { method: "POST" });
      loadEmailActivity();
    } catch (err) {
      alert("Retry error: " + err.message);
      btn.disabled = false;
      btn.textContent = "Retry";
    }
  });

  await ensureChart();
  await load();
  await loadEmailActivity();
}

async function loadEmailActivity() {
  const tbody = document.getElementById("emailOutboxBody");
  const statsBar = document.getElementById("emailStatsBar");
  if (!tbody) return;

  try {
    const [listRes, statsRes] = await Promise.all([
      api(`/admin/emails?limit=25${activeEmailFilter ? `&status=${activeEmailFilter}` : ""}`),
      api("/admin/emails/stats"),
    ]);

    if (statsBar && statsRes.data) {
      const s = statsRes.data;
      statsBar.innerHTML = `
        <div class="stat"><div class="label">Total Queued</div><div class="value" style="font-size:18px">${s.total || 0}</div></div>
        <div class="stat"><div class="label">Pending</div><div class="value" style="font-size:18px; color:#D97706">${s.pending || 0}</div></div>
        <div class="stat"><div class="label">Sent</div><div class="value" style="font-size:18px; color:#2563EB">${s.sent || 0}</div></div>
        <div class="stat"><div class="label">Delivered</div><div class="value" style="font-size:18px; color:#16A34A">${s.delivered || 0}</div></div>
        <div class="stat"><div class="label">Failed</div><div class="value" style="font-size:18px; color:#DC2626">${s.failed || 0}</div></div>
      `;
    }

    const emails = listRes.data || [];
    tbody.innerHTML = emails.length
      ? emails
          .map((m) => {
            const badgeCls =
              m.status === "delivered" ? "b-active" :
              m.status === "failed" || m.status === "bounced" ? "b-overdue" : "b-pending";
            const retryBtn = (m.status === "failed" || m.status === "bounced")
              ? `<button class="btn sm" data-retry-id="${m._id}" style="padding:2px 8px; font-size:11px;">Retry</button>`
              : "—";
            return `<tr>
              <td><strong>${escapeHtml(m.recipientEmailSnapshot || "")}</strong><br><span style="font-size:11px; color:#888;">${escapeHtml(m.recipientNameSnapshot || "")}</span></td>
              <td><code>${escapeHtml(m.eventType || "")}</code></td>
              <td><span class="badge ${badgeCls}">${escapeHtml(m.status)}</span></td>
              <td style="font-family:monospace; font-size:11px;">${escapeHtml(m.providerMessageId || "queued")}</td>
              <td>${m.attemptCount}</td>
              <td style="font-size:12px;">${formatDate(m.createdAt)}</td>
              <td>${retryBtn}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="7" class="muted">No emails matching filter "${activeEmailFilter || "all"}".</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Failed to load email activity: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function load() {
  destroyCharts();
  try {
    const json = await api("/analytics/overview");
    const d = json.data || {};
    const statusMap = Object.fromEntries((d.rentalsByStatus || []).map((s) => [s._id, s.count]));
    document.getElementById("adminStats").innerHTML = [
      ["Books", d.totalBooks],
      ["Users", d.totalUsers],
      ["Active rentals", (statusMap.active || 0) + (statusMap.approved || 0)],
      ["Total rentals", (d.rentalsByStatus || []).reduce((a, s) => a + s.count, 0)],
      ["Active users 30d", d.activeUsersCount],
      ["Overdue", d.overdueRentalsCount],
    ]
      .map(
        ([label, value]) =>
          `<div class="stat${label === "Overdue" ? " overdue" : ""}"><div class="label">${label}</div><div class="value">${value ?? 0}</div></div>`
      )
      .join("");

    const genres = d.genreDistribution || [];
    const gmax = Math.max(1, ...genres.map((g) => g.count));
    document.getElementById("genreBars").innerHTML = genres.length
      ? genres
          .map(
            (g) =>
              `<div class="bar-row"><span>${escapeHtml(g._id || "—")}</span><div class="bar-track"><span style="width:${(g.count / gmax) * 100}%"></span></div><span>${g.count}</span></div>`
          )
          .join("")
      : empty("No genre data.");

    charts.push(
      doughnut("statusChart", d.rentalsByStatus || []),
      line("trendChart", "Rentals", d.rentalTrends || [], "#46282A"),
      line("growthChart", "New users", d.userGrowth || [], "#4A6B53")
    );

    const most = d.mostRentedBooks || [];
    document.getElementById("mostBody").innerHTML = most.length
      ? most
          .map(
            (item) =>
              `<tr><td>${escapeHtml(item.book?.title || "Unknown")}</td><td>${escapeHtml(item.book?.author || "")}</td><td>${item.rentalCount}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="muted">No rental data available</td></tr>`;

    const overdue = d.overdueRentals || [];
    document.getElementById("overdueBody").innerHTML = overdue.length
      ? overdue
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.book?.title || "N/A")}</td><td>${escapeHtml(r.renter?.name || "N/A")}</td><td>${escapeHtml(r.renter?.email || "")}</td><td>${formatDate(r.dueDate)}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="muted">No overdue rentals currently</td></tr>`;
  } catch (ex) {
    document.getElementById("adminStats").innerHTML = empty(escapeHtml(ex.message));
  }
}

function doughnut(id, statusArray) {
  const ctx = document.getElementById(id);
  if (!ctx || !window.Chart) return null;
  return new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels: statusArray.length ? statusArray.map((s) => s._id) : ["No rentals"],
      datasets: [
        {
          data: statusArray.length ? statusArray.map((s) => s.count) : [1],
          backgroundColor: ["#46282A", "#4A6B53", "#D4A359", "#A67B7D", "#6C3B3D", "#94a3b8"],
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function line(id, label, dataArray, color) {
  const ctx = document.getElementById(id);
  if (!ctx || !window.Chart) return null;
  return new window.Chart(ctx, {
    type: "line",
    data: {
      labels: dataArray.length ? dataArray.map((i) => i._id) : ["No recent data"],
      datasets: [
        {
          label,
          data: dataArray.length ? dataArray.map((i) => i.count) : [0],
          borderColor: color,
          backgroundColor: color + "22",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

function destroyCharts() {
  charts.forEach((c) => c?.destroy?.());
  charts = [];
}

function ensureChart() {
  if (window.Chart) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

import { api, escapeHtml, formatDate, coverUrl, statusClass } from "../core.js";
import { empty, chainBadge, toast } from "../ui.js";

const TABS = [
  { key: "active", label: "Active", statuses: ["active", "approved"] },
  { key: "requested", label: "Requested", statuses: ["requested"] },
  { key: "returned", label: "Returned", statuses: ["returned"] },
  { key: "overdue", label: "Overdue", statuses: ["overdue"] },
];

export function renderRentals() {
  return `
    <div class="page-head">
      <div>
        <h1>My rentals</h1>
        <p>Track requests, due dates, and on-chain proof</p>
      </div>
    </div>
    <div class="tabs" id="rentalTabs">
      ${TABS.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
    </div>
    <div id="rentalList"></div>
  `;
}

export async function bindRentals() {
  let all = [];
  let tab = "active";
  const list = document.getElementById("rentalList");
  try {
    const json = await api("/rentals");
    all = json.data || [];
  } catch (ex) {
    list.innerHTML = empty(escapeHtml(ex.message));
    return;
  }

  function paint() {
    const statuses = TABS.find((t) => t.key === tab).statuses;
    const rows = all.filter((r) => {
      if (tab === "overdue") return r.status === "overdue" || isOverdue(r);
      return statuses.includes(r.status);
    });
    if (!rows.length) {
      list.innerHTML = empty(`No ${tab} rentals.`);
      return;
    }
    list.innerHTML = rows.map(rentalCard).join("");
    list.querySelectorAll("[data-return]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await api(`/rentals/${btn.dataset.return}/return`, { method: "PUT" });
          toast("Book marked as returned");
          const json = await api("/rentals");
          all = json.data || [];
          paint();
        } catch (ex) {
          toast(ex.message);
          btn.disabled = false;
        }
      });
    });
  }

  document.getElementById("rentalTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    tab = btn.dataset.tab;
    document.querySelectorAll("#rentalTabs .tab").forEach((el) => el.classList.toggle("active", el === btn));
    paint();
  });
  paint();
}

function isOverdue(r) {
  return ["active", "approved"].includes(r.status) && r.dueDate && new Date(r.dueDate) < new Date();
}

function rentalCard(r) {
  const book = r.book || {};
  const cover = coverUrl(book);
  const canReturn = ["active", "overdue"].includes(r.status) || isOverdue(r);
  const status = isOverdue(r) && r.status !== "returned" ? "overdue" : r.status;
  return `
    <article class="rental-card">
      <div class="thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : ""}</div>
      <div>
        <h3 style="margin:0">${escapeHtml(book.title || "Book")}</h3>
        <p class="muted">${escapeHtml(book.author || "")}</p>
        <div class="row" style="margin:6px 0">
          <span class="badge ${statusClass(status)}">${escapeHtml(status)}</span>
          ${chainBadge(r.contractTxHash)}
        </div>
        <p class="muted">Requested ${formatDate(r.requestDate)} · Due ${formatDate(r.dueDate)} · Returned ${formatDate(r.returnDate)}</p>
      </div>
      <div class="actions">
        ${canReturn ? `<button class="btn sm" data-return="${r._id}">Return Book</button>` : ""}
      </div>
    </article>
  `;
}

import { getUser, initials, coverUrl, escapeHtml, clearSession, go } from "./core.js";

const NAV_ITEMS = [
  { key: "browse", href: "#/browse", label: "Browse" },
  { key: "recommendations", href: "#/recommendations", label: "Recommendations" },
  { key: "rentals", href: "#/rentals", label: "My Rentals" },
  { key: "dashboard", href: "#/dashboard", label: "My Dashboard" },
  { key: "listings", href: "#/listings", label: "My Listings", roles: ["owner", "admin"] },
  { key: "admin", href: "#/admin", label: "Admin Dashboard", roles: ["admin"] },
];

export function renderShell(active) {
  const user = getUser() || {};
  const role = user.role || "student";
  const links = NAV_ITEMS.filter((p) => !p.roles || p.roles.includes(role))
    .map(
      (p) =>
        `<a class="${active === p.key ? "active" : ""}" href="${p.href}">${p.label}</a>`
    )
    .join("");

  return `
    <header class="topnav">
      <a class="brand" href="#/browse"><span class="brand-mark">B</span> BookNexus</a>
      <nav class="nav-links">${links}</nav>
      <div class="nav-right">
        <button class="hamburger" id="navHamburger" aria-label="Menu">☰</button>
        <button class="avatar-btn" id="avatarBtn" aria-label="Profile">${escapeHtml(initials(user.name || "U"))}</button>
        <div class="dropdown" id="profileMenu">
          <a href="#/profile">Profile</a>
          <button type="button" id="logoutBtn">Logout</button>
        </div>
      </div>
    </header>
    <div class="mobile-menu" id="mobileMenu">${links}<a href="#/profile">Profile</a><button class="btn ghost" id="mobileLogout" type="button">Logout</button></div>
    <main class="page" id="pageRoot"></main>
  `;
}

export function bindShell() {
  document.getElementById("avatarBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("profileMenu")?.classList.toggle("open");
  });
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("mobileLogout")?.addEventListener("click", logout);
  document.getElementById("navHamburger")?.addEventListener("click", () => {
    document.getElementById("mobileMenu")?.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-right")) document.getElementById("profileMenu")?.classList.remove("open");
  });
}

export function logout() {
  clearSession();
  go("/login");
}

export function bookCard(book, extra = "") {
  const avail = book.availability === "available";
  const p2p = book.listingType === "p2p";
  const owner = book.owner?.name ? ` · ${escapeHtml(book.owner.name)}` : "";
  const cover = coverUrl(book);
  return `
    <a class="book-card" href="#/book/${book._id}">
      <div class="cover">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : escapeHtml(book.title || "")}</div>
      <div class="card-body">
        <span class="badge b-lib">${escapeHtml(book.genre || "")}</span>
        <h3>${escapeHtml(book.title || "")}</h3>
        <p class="muted">${escapeHtml(book.author || "")}</p>
        <div class="row" style="margin-top:auto;padding-top:8px">
          <span class="badge ${avail ? "b-avail" : "b-out"}">${avail ? "Available" : escapeHtml(book.availability || "Unavailable")}</span>
          ${p2p ? `<span class="badge b-p2p">P2P${owner}</span>` : `<span class="badge b-lib">Library</span>`}
        </div>
        ${extra}
      </div>
    </a>
  `;
}

export function skeletons(n = 8) {
  return Array.from({ length: n })
    .map(
      () => `
      <div class="book-card">
        <div class="skeleton skel-cover"></div>
        <div class="skeleton skel-line"></div>
        <div class="skeleton skel-line short"></div>
      </div>`
    )
    .join("");
}

export function empty(msg) {
  return `<div class="empty-state">${msg}</div>`;
}

export function chainBadge(hash) {
  if (!hash) return "";
  return `<a class="badge b-chain" href="${`https://sepolia.etherscan.io/tx/${hash}`}" target="_blank" rel="noopener">⛓️ Blockchain verified</a>`;
}

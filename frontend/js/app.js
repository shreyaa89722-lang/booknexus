const BN = (() => {
  const TOKEN_KEY = "booknexus_token";
  const USER_KEY = "booknexus_user";
  const API_BASE = window.location.port === "3000" ? "/api" : "http://localhost:5000/api";

  const pages = {
    browse: { href: "browse.html", label: "Browse" },
    recommendations: { href: "recommendations.html", label: "Recommendations" },
    rentals: { href: "rentals.html", label: "My Rentals" },
    me: { href: "dashboard.html", label: "My Dashboard" },
    listings: { href: "listings.html", label: "My Listings", roles: ["owner", "admin"] },
    admin: { href: "admin.html", label: "Admin Dashboard", roles: ["admin"] },
  };

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("bookhive_token");
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || localStorage.getItem("bookhive_user") || "null");
    } catch {
      return null;
    }
  }

  function setSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    localStorage.removeItem("bookhive_token");
    localStorage.removeItem("bookhive_user");
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("bookhive_token");
    localStorage.removeItem("bookhive_user");
    window.location.href = "login.html";
  }

  function requireAuth() {
    if (!getToken()) {
      window.location.href = "login.html";
      return null;
    }
    return getUser();
  }

  function afterLogin(user) {
    if (user.role === "admin") window.location.href = "admin.html";
    else window.location.href = "browse.html";
  }

  async function api(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = {};
    try {
      json = await res.json();
    } catch {
      json = { success: false, message: res.statusText || "Request failed" };
    }
    if (res.status === 401 && auth) {
      logout();
      throw new Error(json.message || "Session expired");
    }
    if (!json.success) {
      const extra = (json.errors || []).map((e) => e.message).join(" ");
      throw new Error(extra || json.message || "Request failed");
    }
    return json;
  }

  function initials(name = "B") {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  function coverStyle(book) {
    if (book?.coverUrl) return `background-image:url('${book.coverUrl}')`;
    return "";
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  }

  function etherscan(hash) {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
  }

  function toast(msg) {
    let el = document.getElementById("bnToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bnToast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 2800);
  }

  function renderNav(active) {
    const user = getUser() || {};
    const role = user.role || "student";
    const links = Object.entries(pages)
      .filter(([, p]) => !p.roles || p.roles.includes(role))
      .map(([key, p]) => `<a class="${active === key ? "active" : ""}" href="${p.href}">${p.label}</a>`)
      .join("");

    const nav = document.getElementById("appNav");
    if (!nav) return;
    nav.innerHTML = `
      <a class="brand" href="browse.html">BookNexus</a>
      <div class="nav-links">${links}</div>
      <div class="nav-right">
        <button class="hamburger" id="navHamburger" aria-label="Menu">☰</button>
        <button class="avatar-btn" id="avatarBtn" aria-label="Profile">${initials(user.name || "U")}</button>
        <div class="dropdown" id="profileMenu">
          <a href="profile.html">Profile</a>
          <button type="button" id="logoutBtn">Logout</button>
        </div>
      </div>
    `;
    const mobile = document.getElementById("mobileMenu");
    if (mobile) {
      mobile.innerHTML = `${links}<a href="profile.html">Profile</a><a href="#" id="mobileLogout">Logout</a>`;
    }
    document.getElementById("avatarBtn")?.addEventListener("click", () => {
      document.getElementById("profileMenu")?.classList.toggle("open");
    });
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("mobileLogout")?.addEventListener("click", (e) => { e.preventDefault(); logout(); });
    document.getElementById("navHamburger")?.addEventListener("click", () => {
      const m = document.getElementById("mobileMenu");
      if (m) m.style.display = m.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-right")) document.getElementById("profileMenu")?.classList.remove("open");
    });
  }

  function bookCard(book) {
    const avail = book.availability === "available";
    const p2p = book.listingType === "p2p";
    const owner = book.owner?.name ? ` · ${book.owner.name}` : "";
    return `
      <a class="book-card" href="book.html?id=${book._id}">
        <div class="cover" style="${coverStyle(book)}">${book.coverUrl ? `<img src="${book.coverUrl}" alt="">` : book.title}</div>
        <div class="card-body">
          <span class="badge ${book.genre ? "b-lib" : ""}">${book.genre || ""}</span>
          <h3>${book.title}</h3>
          <p class="muted">${book.author}</p>
          <div class="row" style="margin-top:auto;padding-top:8px">
            <span class="badge ${avail ? "b-avail" : "b-out"}">${avail ? "Available" : book.availability}</span>
            ${p2p ? `<span class="badge b-p2p">P2P${owner}</span>` : `<span class="badge b-lib">Library</span>`}
          </div>
        </div>
      </a>
    `;
  }

  function skeletons(n = 8) {
    return Array.from({ length: n }).map(() => `
      <div class="book-card">
        <div class="skeleton skel-cover"></div>
        <div class="skeleton skel-line"></div>
        <div class="skeleton skel-line short"></div>
      </div>
    `).join("");
  }

  function empty(msg) {
    return `<div class="empty">${msg}</div>`;
  }

  return {
    api, getToken, getUser, setSession, logout, requireAuth, afterLogin,
    renderNav, bookCard, skeletons, empty, toast, formatDate, etherscan,
    isEmail, coverStyle, initials,
  };
})();

import { getToken, getUser, parseHash, go, clearSession } from "./core.js";
import { renderShell, bindShell } from "./ui.js";
import { renderLogin, bindLogin, renderSignup, bindSignup } from "./pages/auth.js";
import {
  renderBrowse,
  bindBrowse,
  renderBook,
  bindBook,
  renderRecommendations,
  bindRecommendations,
} from "./pages/browse.js";
import { renderRentals, bindRentals } from "./pages/rentals.js";
import { renderListings, bindListings, renderBookForm, bindBookForm } from "./pages/owner.js";
import { renderAdmin, bindAdmin } from "./pages/admin.js";
import { renderDashboard, bindDashboard, renderProfile, bindProfile } from "./pages/me.js";

const AUTH_PAGES = new Set(["login", "signup"]);
const ROLE_PAGES = {
  listings: ["owner", "admin"],
  admin: ["admin"],
  "book-form": ["owner", "admin"],
};

const app = document.getElementById("app");

function routeKey(parts) {
  if (!parts.length) return "browse";
  if (parts[0] === "book" && parts[1]) return "book";
  if (parts[0] === "books" && parts[1] === "new") return "book-form";
  if (parts[0] === "books" && parts[2] === "edit") return "book-form";
  return parts[0];
}

async function render() {
  const { parts } = parseHash();
  let key = routeKey(parts);
  const token = getToken();
  const user = getUser();

  if (!token && !AUTH_PAGES.has(key)) {
    go("/login");
    return;
  }
  if (token && AUTH_PAGES.has(key)) {
    go(user?.role === "admin" ? "/admin" : "/browse");
    return;
  }

  const needed = ROLE_PAGES[parts.join("/")] || ROLE_PAGES[key];
  if (needed && user && !needed.includes(user.role)) {
    go("/browse");
    return;
  }

  if (AUTH_PAGES.has(key)) {
    app.innerHTML = key === "signup" ? renderSignup() : renderLogin();
    if (key === "signup") bindSignup();
    else bindLogin();
    return;
  }

  const navKey =
    key === "book-form" ? "listings" : key === "book" ? "browse" : key === "recommendations" ? "recommendations" : key;
  app.className = "app-shell";
  app.innerHTML = renderShell(navKey);
  bindShell();
  const root = document.getElementById("pageRoot");

  try {
    if (key === "browse") {
      root.innerHTML = renderBrowse();
      await bindBrowse();
    } else if (key === "book") {
      root.innerHTML = renderBook();
      await bindBook(parts[1]);
    } else if (key === "recommendations") {
      root.innerHTML = renderRecommendations();
      await bindRecommendations();
    } else if (key === "rentals") {
      root.innerHTML = renderRentals();
      await bindRentals();
    } else if (key === "listings") {
      root.innerHTML = renderListings();
      await bindListings();
    } else if (key === "book-form") {
      const id = parts[0] === "books" && parts[2] === "edit" ? parts[1] : null;
      root.innerHTML = renderBookForm(Boolean(id));
      await bindBookForm(id);
    } else if (key === "admin") {
      root.classList.add("wide");
      root.innerHTML = renderAdmin();
      await bindAdmin();
    } else if (key === "dashboard") {
      root.innerHTML = renderDashboard();
      await bindDashboard();
    } else if (key === "profile") {
      root.innerHTML = renderProfile();
      bindProfile();
    } else {
      go("/browse");
    }
  } catch (ex) {
    if (ex.unauth) {
      clearSession();
      go("/login");
      return;
    }
    root.innerHTML = `<div class="empty-state">${ex.message || "Something went wrong"}</div>`;
  }
}

window.addEventListener("hashchange", render);
if (!location.hash) location.hash = getToken() ? "#/browse" : "#/login";
render();

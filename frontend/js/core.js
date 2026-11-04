export const TOKEN_KEY = "booknexus_token";
export const USER_KEY = "booknexus_user";
const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
export const API_BASE = (typeof window !== "undefined" && window.API_BASE) || (isLocal ? (window.location.port === "3000" ? "/api" : "http://localhost:5000/api") : "/api");

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("bookhive_token") || "";
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || localStorage.getItem("bookhive_user") || "null");
  } catch {
    return null;
  }
}

export function setSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  localStorage.removeItem("bookhive_token");
  localStorage.removeItem("bookhive_user");
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("bookhive_token");
  localStorage.removeItem("bookhive_user");
}

export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function initials(name = "U") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function etherscan(hash) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function toast(msg) {
  let el = document.getElementById("bnToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "bnToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 2800);
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
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
    clearSession();
    if (!String(location.hash).includes("/login")) location.hash = "#/login";
    const err = new Error(friendlyAuthMessage(json.message) || "Session expired");
    err.status = 401;
    err.unauth = true;
    throw err;
  }
  if (!json.success) {
    const extra = (json.errors || []).map((e) => e.message).join(" ");
    const err = new Error(friendlyAuthMessage(extra || json.message) || "Request failed");
    err.status = res.status;
    err.errors = json.errors || [];
    throw err;
  }
  return json;
}

function friendlyAuthMessage(msg) {
  if (!msg) return msg;
  if (/invalid credentials/i.test(msg)) return "Invalid email or password";
  if (/already exists/i.test(msg)) return "Email already exists";
  return msg;
}

export function parseHash() {
  const raw = (location.hash || "#/browse").replace(/^#\/?/, "");
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const query = {};
  new URLSearchParams(queryPart || "").forEach((v, k) => {
    query[k] = v;
  });
  return { parts, query, path: parts.join("/") };
}

export function go(hash) {
  location.hash = hash.startsWith("#") ? hash : `#${hash}`;
}

export function coverUrl(book) {
  return book?.coverUrl || "";
}

export function statusClass(status) {
  if (status === "overdue") return "b-overdue";
  if (status === "active" || status === "approved") return "b-active";
  if (status === "requested") return "b-requested";
  if (status === "returned") return "b-returned";
  return "b-lib";
}

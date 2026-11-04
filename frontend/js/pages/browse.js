import { api, escapeHtml, getUser, coverUrl } from "../core.js";
import { bookCard, skeletons, empty } from "../ui.js";

export function renderBrowse() {
  return `
    <div class="page-head">
      <div>
        <h1>Browse books</h1>
        <p>Search the library and peer-to-peer listings</p>
      </div>
    </div>
    <div class="filters">
      <input id="q" placeholder="Search title, author, genre, subject">
      <select id="genre"><option value="">All genres</option></select>
      <select id="listingType">
        <option value="">All listing types</option>
        <option value="library">Library</option>
        <option value="p2p">P2P</option>
      </select>
      <label class="toggle"><input type="checkbox" id="availOnly"> Available only</label>
    </div>
    <div class="grid" id="bookGrid">${skeletons()}</div>
    <div class="pager" id="pager"></div>
  `;
}

export async function bindBrowse() {
  const state = { page: 1, q: "", genre: "", listingType: "", availability: "" };
  const grid = document.getElementById("bookGrid");
  const pager = document.getElementById("pager");
  const q = document.getElementById("q");
  const genre = document.getElementById("genre");
  const listingType = document.getElementById("listingType");
  const availOnly = document.getElementById("availOnly");

  await fillGenres(genre);

  let t;
  q.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = q.value.trim();
      state.page = 1;
      load();
    }, 280);
  });
  genre.addEventListener("change", () => {
    state.genre = genre.value;
    state.page = 1;
    load();
  });
  listingType.addEventListener("change", () => {
    state.listingType = listingType.value;
    state.page = 1;
    load();
  });
  availOnly.addEventListener("change", () => {
    state.availability = availOnly.checked ? "available" : "";
    state.page = 1;
    load();
  });

  async function load() {
    grid.innerHTML = skeletons();
    const params = new URLSearchParams({ page: String(state.page), limit: "12" });
    if (state.q) params.set("q", state.q);
    if (state.genre) params.set("genre", state.genre);
    if (state.listingType) params.set("listingType", state.listingType);
    if (state.availability) params.set("availability", state.availability);
    try {
      const json = await api(`/books?${params}`, { auth: false });
      const books = json.data || [];
      grid.innerHTML = books.length ? books.map(bookCard).join("") : empty("No books match those filters.");
      const pg = json.pagination || { page: 1, pages: 1 };
      pager.innerHTML =
        pg.pages > 1
          ? `<button class="btn secondary sm" ${pg.page <= 1 ? "disabled" : ""} data-p="${pg.page - 1}">Previous</button>
             <span class="muted">Page ${pg.page} of ${pg.pages}</span>
             <button class="btn secondary sm" ${pg.page >= pg.pages ? "disabled" : ""} data-p="${pg.page + 1}">Next</button>`
          : "";
      pager.querySelectorAll("button[data-p]").forEach((b) => {
        b.addEventListener("click", () => {
          state.page = Number(b.dataset.p);
          load();
        });
      });
    } catch (ex) {
      grid.innerHTML = empty(escapeHtml(ex.message));
    }
  }

  load();
}

async function fillGenres(select) {
  try {
    const json = await api("/books?limit=100", { auth: false });
    const genres = [...new Set((json.data || []).map((b) => b.genre).filter(Boolean))].sort();
    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      select.appendChild(opt);
    });
  } catch {
    /* optional */
  }
}

export function renderBook() {
  return `<div id="bookDetail">${skeletons(1)}</div>`;
}

export async function bindBook(id) {
  const root = document.getElementById("bookDetail");
  const me = getUser();
  try {
    const json = await api(`/books/${id}`, { auth: false });
    const book = json.data;
    const avail = book.availability === "available";
    const own = book.owner && me && (book.owner._id === me._id || book.owner === me._id);
    const disabled = !avail || own;
    const reason = own ? "You can't rent your own listing" : !avail ? "Currently unavailable" : "";
    const cover = coverUrl(book);
    root.innerHTML = `
      <p><a class="btn ghost sm" href="#/browse">← Back to browse</a></p>
      <div class="detail">
        <div class="cover">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : escapeHtml(book.title)}</div>
        <div>
          <div class="row">
            <span class="badge b-lib">${escapeHtml(book.genre || "")}</span>
            <span class="badge ${avail ? "b-avail" : "b-out"}">${escapeHtml(book.availability || "")}</span>
            ${book.listingType === "p2p" ? `<span class="badge b-p2p">P2P</span>` : `<span class="badge b-lib">Library</span>`}
          </div>
          <h1>${escapeHtml(book.title)}</h1>
          <p class="muted">${escapeHtml(book.author)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(book.subject || "—")}</p>
          <p><strong>Condition:</strong> ${escapeHtml(book.condition || "good")}</p>
          ${
            book.listingType === "p2p"
              ? `<p><strong>Owner:</strong> ${escapeHtml(book.owner?.name || "Owner")} · <strong>₹${escapeHtml(book.rentalPricePerWeek || 0)}</strong> / week</p>`
              : ""
          }
          <p>${escapeHtml(book.description || "No description yet.")}</p>
          <div id="rentMsg"></div>
          <button class="btn" id="rentBtn" ${disabled ? "disabled" : ""}>Request to Rent</button>
          ${reason ? `<p class="muted">${reason}</p>` : ""}
        </div>
      </div>
    `;
    document.getElementById("rentBtn")?.addEventListener("click", async () => {
      const btn = document.getElementById("rentBtn");
      const msg = document.getElementById("rentMsg");
      btn.disabled = true;
      btn.textContent = "Requesting…";
      try {
        await api("/rentals", { method: "POST", body: { bookId: book._id } });
        msg.innerHTML = `<div class="ok-box">Request sent. The owner will review it shortly.</div>`;
        btn.textContent = "Requested";
      } catch (ex) {
        msg.innerHTML = `<div class="error-box">${escapeHtml(ex.message)}</div>`;
        btn.disabled = disabled;
        btn.textContent = "Request to Rent";
      }
    });
  } catch (ex) {
    root.innerHTML = empty(escapeHtml(ex.message));
  }
}

export function renderRecommendations() {
  return `
    <div class="page-head">
      <div>
        <h1>My recommendations</h1>
        <p>Picked for you</p>
      </div>
    </div>
    <div id="recHint"></div>
    <div class="grid" id="recGrid">${skeletons()}</div>
  `;
}

export async function bindRecommendations() {
  const grid = document.getElementById("recGrid");
  const hint = document.getElementById("recHint");
  try {
    const json = await api("/recommendations");
    const items = json.data || [];
    const cold = items.length && items.every((i) => i.matchScore == null);
    if (cold) {
      hint.innerHTML = `<div class="ok-box">No reading history yet — showing newest books as a starting point. Add preferences or rent a book to personalize this.</div>`;
    }
    if (!items.length) {
      grid.innerHTML = empty("No recommendations right now. Browse the catalog to get started.");
      return;
    }
    grid.innerHTML = items
      .map(({ book, matchScore }) => {
        const pct = matchScore == null ? null : Math.round(Number(matchScore) * 100);
        const extra =
          pct == null
            ? ""
            : `<div class="muted">Match ${pct}%</div><div class="score-bar"><span style="width:${pct}%"></span></div>`;
        return bookCard(book, extra);
      })
      .join("");
  } catch (ex) {
    grid.innerHTML = empty(escapeHtml(ex.message));
  }
}

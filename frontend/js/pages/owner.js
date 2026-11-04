import { api, escapeHtml, formatDate, coverUrl, getUser, go } from "../core.js";
import { empty, toast } from "../ui.js";

export function renderListings() {
  return `
    <div class="page-head">
      <div>
        <h1>My listings</h1>
        <p>Manage P2P books and incoming requests</p>
      </div>
      <a class="btn" href="#/books/new">+ Add a Book</a>
    </div>
    <div class="stack" id="listingList"></div>
    <h2 style="margin-top:28px">Incoming requests</h2>
    <div id="incoming"></div>
  `;
}

export async function bindListings() {
  const me = getUser();
  const listingList = document.getElementById("listingList");
  const incoming = document.getElementById("incoming");
  try {
    const [booksJson, rentalsJson] = await Promise.all([api("/books?limit=100"), api("/rentals")]);
    const mine = (booksJson.data || []).filter((b) => {
      const oid = b.owner?._id || b.owner;
      return oid && me && String(oid) === String(me._id);
    });
    if (!mine.length) listingList.innerHTML = empty("You have no listings yet. Add a book to start lending.");
    else {
      listingList.innerHTML = mine
        .map((b) => {
          const cover = coverUrl(b);
          return `
            <article class="list-card" style="display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center">
              <div class="thumb" style="width:64px;height:84px;border-radius:8px;overflow:hidden;background:var(--parchment)">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : ""}</div>
              <div>
                <h3 style="margin:0">${escapeHtml(b.title)}</h3>
                <div class="row"><span class="badge ${b.availability === "available" ? "b-avail" : "b-out"}">${escapeHtml(b.availability)}</span></div>
              </div>
              <div class="row">
                <a class="btn secondary sm" href="#/books/${b._id}/edit">Edit</a>
                <button class="btn danger sm" data-del="${b._id}">Delete</button>
              </div>
            </article>`;
        })
        .join("");
      listingList.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this listing?")) return;
          try {
            await api(`/books/${btn.dataset.del}`, { method: "DELETE" });
            toast("Listing deleted");
            bindListings();
          } catch (ex) {
            toast(ex.message);
          }
        });
      });
    }

    const requests = (rentalsJson.data || []).filter((r) => {
      const oid = r.owner?._id || r.owner;
      return r.status === "requested" && oid && me && String(oid) === String(me._id);
    });
    if (!requests.length) incoming.innerHTML = empty("No incoming rental requests.");
    else {
      incoming.innerHTML = requests
        .map(
          (r) => `
          <article class="rental-card">
            <div></div>
            <div>
              <h3 style="margin:0">${escapeHtml(r.book?.title || "Book")}</h3>
              <p class="muted">Requested by ${escapeHtml(r.renter?.name || "Student")} · ${formatDate(r.requestDate)}</p>
            </div>
            <div class="row actions">
              <button class="btn sm" data-ok="${r._id}">Approve</button>
              <button class="btn secondary sm" data-no="${r._id}">Reject</button>
            </div>
          </article>`
        )
        .join("");
      incoming.querySelectorAll("[data-ok]").forEach((b) =>
        b.addEventListener("click", () => act(b.dataset.ok, "approve"))
      );
      incoming.querySelectorAll("[data-no]").forEach((b) =>
        b.addEventListener("click", () => act(b.dataset.no, "reject"))
      );
    }
  } catch (ex) {
    listingList.innerHTML = empty(escapeHtml(ex.message));
  }

  async function act(id, verb) {
    try {
      await api(`/rentals/${id}/${verb}`, { method: "PUT" });
      toast(verb === "approve" ? "Request approved" : "Request rejected");
      bindListings();
    } catch (ex) {
      toast(ex.message);
    }
  }
}

export function renderBookForm(isEdit) {
  return `
    <div class="page-head">
      <div>
        <h1>${isEdit ? "Edit book" : "Add a book"}</h1>
        <p>Fields marked required match backend validation</p>
      </div>
      <a class="btn secondary" href="#/listings">Cancel</a>
    </div>
    <form class="panel" id="bookForm" style="max-width:760px">
      <div id="formError" class="error-box" hidden></div>
      <div class="form-grid">
        <div class="field"><label>Title *</label><input name="title" required maxlength="200"><div class="hint" data-h="title"></div></div>
        <div class="field"><label>Author *</label><input name="author" required maxlength="150"><div class="hint" data-h="author"></div></div>
        <div class="field"><label>Genre *</label><input name="genre" required><div class="hint" data-h="genre"></div></div>
        <div class="field"><label>Subject *</label><input name="subject" required><div class="hint" data-h="subject"></div></div>
        <div class="field full"><label>Description</label><textarea name="description" rows="4"></textarea></div>
        <div class="field">
          <label>Condition</label>
          <select name="condition">
            <option value="new">New</option>
            <option value="good" selected>Good</option>
            <option value="fair">Fair</option>
            <option value="worn">Worn</option>
          </select>
        </div>
        <div class="field"><label>Cover URL</label><input name="coverUrl" placeholder="https://…"></div>
        <div class="field full">
          <label>Listing type</label>
          <div class="role-toggle">
            <label><input type="radio" name="listingType" value="library"> Library</label>
            <label><input type="radio" name="listingType" value="p2p" checked> P2P</label>
          </div>
        </div>
        <div class="field" id="priceField"><label>Weekly price *</label><input name="rentalPricePerWeek" type="number" min="0.01" step="0.01"><div class="hint" data-h="price"></div></div>
      </div>
      <button class="btn" id="saveBtn" type="submit">${isEdit ? "Update" : "Save"}</button>
    </form>
  `;
}

export async function bindBookForm(id) {
  const form = document.getElementById("bookForm");
  const err = document.getElementById("formError");
  const btn = document.getElementById("saveBtn");
  const priceField = document.getElementById("priceField");

  const togglePrice = () => {
    const p2p = form.listingType.value === "p2p";
    priceField.style.display = p2p ? "block" : "none";
  };
  form.querySelectorAll("[name=listingType]").forEach((el) => el.addEventListener("change", togglePrice));
  togglePrice();

  if (id) {
    try {
      const json = await api(`/books/${id}`);
      const b = json.data;
      form.title.value = b.title || "";
      form.author.value = b.author || "";
      form.genre.value = b.genre || "";
      form.subject.value = b.subject || "";
      form.description.value = b.description || "";
      form.condition.value = b.condition || "good";
      form.coverUrl.value = b.coverUrl || "";
      form.listingType.value = b.listingType || "p2p";
      form.querySelector(`[name=listingType][value="${b.listingType || "p2p"}"]`).checked = true;
      form.rentalPricePerWeek.value = b.rentalPricePerWeek || "";
      togglePrice();
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message;
    }
  }

  const live = () => {
    let ok = true;
    const need = ["title", "author", "genre", "subject"];
    need.forEach((n) => {
      const h = form.querySelector(`[data-h="${n}"]`);
      if (!form[n].value.trim()) {
        h.textContent = `${n[0].toUpperCase() + n.slice(1)} is required`;
        h.className = "hint bad";
        ok = false;
      } else {
        h.textContent = "";
        h.className = "hint";
      }
    });
    const priceHint = form.querySelector('[data-h="price"]');
    if (form.listingType.value === "p2p") {
      const price = Number(form.rentalPricePerWeek.value);
      if (!(price > 0)) {
        priceHint.textContent = "Price must be a positive number";
        priceHint.className = "hint bad";
        ok = false;
      } else {
        priceHint.textContent = "";
        priceHint.className = "hint";
      }
    }
    return ok;
  };
  form.addEventListener("input", live);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!live()) return;
    btn.disabled = true;
    btn.textContent = "Saving…";
    const body = {
      title: form.title.value.trim(),
      author: form.author.value.trim(),
      genre: form.genre.value.trim(),
      subject: form.subject.value.trim(),
      description: form.description.value.trim(),
      condition: form.condition.value,
      coverUrl: form.coverUrl.value.trim(),
      listingType: form.listingType.value,
      rentalPricePerWeek: form.listingType.value === "p2p" ? Number(form.rentalPricePerWeek.value) : 0,
    };
    try {
      if (id) await api(`/books/${id}`, { method: "PUT", body });
      else await api("/books", { method: "POST", body });
      toast(id ? "Book updated" : "Book added");
      go("/listings");
    } catch (ex) {
      err.hidden = false;
      err.textContent = (ex.errors || []).map((x) => x.message).join(" ") || ex.message;
      btn.disabled = false;
      btn.textContent = id ? "Update" : "Save";
    }
  });
}

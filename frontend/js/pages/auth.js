import { api, setSession, isEmail, go, getToken } from "../core.js";

export function renderLogin() {
  return `
    <div class="auth-wrap">
      <form class="auth-card" id="loginForm">
        <div class="brand" style="justify-content:center;margin-bottom:8px"><span class="brand-mark">B</span> BookNexus</div>
        <p class="tagline" style="text-align:center">Academic library & student rental sanctuary</p>
        <div id="formError" class="error-box" hidden></div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required placeholder="you@college.edu">
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button class="btn block" id="submitBtn" type="submit">Log in</button>
        <p class="auth-foot">Don't have an account? <a href="#/signup">Sign up</a></p>
      </form>
    </div>
  `;
}

export function bindLogin() {
  if (getToken()) {
    go("/browse");
    return;
  }
  const form = document.getElementById("loginForm");
  const err = document.getElementById("formError");
  const btn = document.getElementById("submitBtn");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "Logging in…";
    try {
      const email = form.email.value.trim();
      const password = form.password.value;
      const json = await api("/auth/login", { method: "POST", body: { email, password }, auth: false });
      setSession(json.data);
      go(json.data.role === "admin" ? "/admin" : "/browse");
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message || "Invalid email or password";
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });
}

export function renderSignup() {
  return `
    <div class="auth-wrap">
      <form class="auth-card" id="signupForm">
        <div class="brand" style="justify-content:center;margin-bottom:8px"><span class="brand-mark">B</span> BookNexus</div>
        <p class="tagline" style="text-align:center">Create your account</p>
        <div id="formError" class="error-box" hidden></div>
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" name="name" required maxlength="100" placeholder="Your name">
          <div class="hint" id="nameHint"></div>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="you@college.edu">
          <div class="hint" id="emailHint"></div>
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" required>
          <div class="hint" id="passwordHint">Must be at least 6 characters</div>
        </div>
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" required>
          <div class="hint" id="confirmHint"></div>
        </div>
        <div class="field">
          <label>I am a</label>
          <div class="role-toggle">
            <label><input type="radio" name="role" value="student" checked> Student</label>
            <label><input type="radio" name="role" value="owner"> Book Owner</label>
          </div>
        </div>
        <button class="btn block" id="submitBtn" type="submit">Create account</button>
        <p class="auth-foot">Already have an account? <a href="#/login">Log in</a></p>
      </form>
    </div>
  `;
}

function setHint(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `hint ${ok ? "ok" : text ? "bad" : ""}`;
}

export function bindSignup() {
  const form = document.getElementById("signupForm");
  const err = document.getElementById("formError");
  const btn = document.getElementById("submitBtn");

  const validateLive = () => {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;
    let ok = true;

    if (!name) {
      setHint("nameHint", "Name is required", false);
      ok = false;
    } else {
      setHint("nameHint", "Looks good", true);
    }

    if (!email) {
      setHint("emailHint", "Email is required", false);
      ok = false;
    } else if (!isEmail(email)) {
      setHint("emailHint", "Enter a valid email format", false);
      ok = false;
    } else {
      setHint("emailHint", "Valid email", true);
    }

    if (password.length < 6) {
      setHint("passwordHint", "Password must be at least 6 characters", false);
      ok = false;
    } else {
      setHint("passwordHint", "Strong enough", true);
    }

    if (confirm && confirm !== password) {
      setHint("confirmHint", "Passwords do not match", false);
      ok = false;
    } else if (confirm) {
      setHint("confirmHint", "Passwords match", true);
    } else {
      setHint("confirmHint", "", true);
      ok = false;
    }
    return ok;
  };

  form.addEventListener("input", validateLive);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateLive()) return;
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "Creating account…";
    try {
      const json = await api("/auth/register", {
        method: "POST",
        auth: false,
        body: {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
          role: form.role.value,
        },
      });
      setSession(json.data);
      go("/browse");
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message || "Could not create account";
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
}

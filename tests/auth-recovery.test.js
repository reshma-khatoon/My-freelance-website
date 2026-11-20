const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const adminId = "ed313df0-8ac0-4426-88ca-235ee0b735a6";

function loadScript(file, ids, auth) {
  const elements = Object.fromEntries(ids.map((id) => [id, {
    hidden: id === "reset-form" || id === "recovery-form",
    value: "",
    textContent: "",
    type: "password",
    listeners: {},
    addEventListener(event, callback) { this.listeners[event] = callback; },
    focus() {},
    reset() { this.resetCalled = true; }
  }]));
  const timers = [];
  const location = { href: "", replace(url) { this.href = url; } };
  const context = {
    document: { getElementById(id) { return elements[id]; } },
    window: { supabase: { createClient() { return { auth }; } }, location },
    setTimeout(callback) { timers.push(callback); },
    console: { error() {} }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  return { elements, timers, location };
}

const resetIds = [
  "reset-form", "reset-status", "reset-btn", "new-password",
  "confirm-password", "show-password"
];
const submit = { preventDefault() {} };

test("only a verified admin recovery event opens the form", async () => {
  let listener;
  let user = { id: "another-user" };
  const auth = {
    onAuthStateChange(callback) { listener = callback; },
    async getUser() { return { data: { user }, error: null }; }
  };
  const { elements, timers } = loadScript("reset-password.js", resetIds, auth);
  listener("INITIAL_SESSION", { user: { id: adminId } });
  assert.equal(elements["reset-form"].hidden, true);
  listener("PASSWORD_RECOVERY", { user });
  await timers.shift()();
  assert.equal(elements["reset-form"].hidden, true);
  assert.match(elements["reset-status"].textContent, /not authorized/);
  user = { id: adminId };
  listener("PASSWORD_RECOVERY", { user });
  await timers.shift()();
  assert.equal(elements["reset-form"].hidden, false);
  listener("SIGNED_OUT", null);
  assert.equal(elements["reset-form"].hidden, true);
});

test("recovery validates passwords, updates them, and returns to login", async () => {
  let listener;
  const updates = [];
  let updateError = new Error("Password is too weak");
  const auth = {
    onAuthStateChange(callback) { listener = callback; },
    async getUser() { return { data: { user: { id: adminId } }, error: null }; },
    async updateUser(data) { updates.push(data.password); return { error: updateError }; }
  };
  const { elements, timers, location } = loadScript("reset-password.js", resetIds, auth);
  await elements["reset-form"].listeners.submit(submit);
  assert.equal(updates.length, 0);
  listener("PASSWORD_RECOVERY", { user: { id: adminId } });
  await timers.shift()();
  elements["new-password"].value = "new-password";
  elements["confirm-password"].value = "different";
  await elements["reset-form"].listeners.submit(submit);
  assert.match(elements["reset-status"].textContent, /do not match/);
  assert.equal(updates.length, 0);
  elements["show-password"].listeners.change({ target: { checked: true } });
  assert.equal(elements["new-password"].type, "text");
  assert.equal(elements["confirm-password"].type, "text");
  elements["confirm-password"].value = "new-password";
  await elements["reset-form"].listeners.submit(submit);
  assert.match(elements["reset-status"].textContent, /too weak/);
  assert.equal(elements["reset-form"].hidden, false);
  updateError = null;
  await elements["reset-form"].listeners.submit(submit);
  assert.deepEqual(updates, ["new-password", "new-password"]);
  assert.match(elements["reset-status"].textContent, /successfully/);
  assert.equal(elements["reset-form"].hidden, true);
  timers.shift()();
  assert.equal(location.href, "admin.html");
});

test("login recovery requests the production reset URL and login remains unchanged", async () => {
  const calls = [];
  const auth = {
    async resetPasswordForEmail(email, options) {
      calls.push({ email, redirectTo: options.redirectTo });
      return { error: null };
    },
    async signInWithPassword(credentials) {
      calls.push(credentials);
      return { data: { user: { id: adminId } }, error: null };
    }
  };
  const ids = [
    "admin-login-form", "login-btn", "login-status", "admin-email",
    "admin-password", "forgot-password-link", "recovery-form",
    "recovery-btn", "recovery-status", "recovery-email"
  ];
  const { elements, location } = loadScript("admin.js", ids, auth);
  elements["admin-email"].value = "admin@example.test";
  elements["forgot-password-link"].listeners.click(submit);
  await elements["recovery-form"].listeners.submit(submit);
  assert.deepEqual(calls[0], {
    email: "admin@example.test",
    redirectTo: "https://mywebsite-xi-ashy.vercel.app/reset-password.html"
  });
  elements["admin-password"].value = "new-password";
  await elements["admin-login-form"].listeners.submit(submit);
  assert.equal(calls[1].password, "new-password");
  assert.equal(location.href, "dashboard.html");
});

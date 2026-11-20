const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function run(file, context) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
}

function utilities() {
  const context = vm.createContext({ window: {} });
  run("contact-utils.js", context);
  return context.window.RDContact;
}

test("Indian phone normalization rejects missing, malformed, and non-mobile numbers", () => {
  const { normalizeIndianPhone } = utilities();
  assert.equal(normalizeIndianPhone("98765 43210"), "+919876543210");
  assert.equal(normalizeIndianPhone("+91 (98765) 43210"), "+919876543210");
  assert.equal(normalizeIndianPhone("09876543210"), "+919876543210");
  for (const phone of ["", "+1 9876543210", "1234567890", "987654321a", "98765432100"]) {
    assert.equal(normalizeIndianPhone(phone), null);
  }
});

test("contact links encode personalized inquiry details and omit invalid destinations", () => {
  const { contactLinks } = utilities();
  const inquiry = {
    name: "A & B",
    email: "hello+design@example.com",
    phone: "9876543210",
    message: "A website for café & shop?\nBudget: ₹5,000"
  };
  const links = contactLinks(inquiry);
  assert.equal(links.call, "tel:+919876543210");
  const whatsapp = new URL(links.whatsapp);
  assert.equal(whatsapp.origin + whatsapp.pathname, "https://wa.me/919876543210");
  assert.match(whatsapp.searchParams.get("text"), /Hello A & B/);
  assert.ok(whatsapp.searchParams.get("text").includes(inquiry.message));
  const mailto = new URL(links.email);
  assert.equal(decodeURIComponent(mailto.pathname), inquiry.email);
  assert.ok(mailto.searchParams.get("body").includes(inquiry.message));
  assert.ok(mailto.searchParams.get("subject").includes("café & shop?"));
  const unavailable = contactLinks({ name: "Customer", message: "Logo design", phone: "123", email: "bad\n@example.com" });
  assert.equal(unavailable.call, null);
  assert.equal(unavailable.whatsapp, null);
  assert.equal(unavailable.email, null);
});

function element() {
  return {
    children: [], style: {}, listeners: {}, value: "", textContent: "",
    append(...items) { this.children.push(...items); },
    appendChild(item) { this.children.push(item); },
    replaceChildren(...items) { this.children = items; },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, callback) { this.listeners[name] = callback; }
  };
}

test("contact form saves an optional normalized phone and rejects invalid input", async () => {
  const elements = {};
  const records = [];
  const contactForm = element();
  contactForm.reset = function () {};
  elements["contact-form"] = contactForm;
  for (const id of ["year", "submit-btn", "form-status", "from_name", "from_email", "phone", "message"]) {
    elements[id] = element();
  }
  elements["from_name"].value = "Priya";
  elements["from_email"].value = "priya@example.com";
  elements["message"].value = "A website for my shop";
  const context = vm.createContext({
    window: {
      RDContact: utilities(),
      emailjs: true,
      supabase: {
        createClient() {
          return {
            from() {
              return { async insert(rows) { records.push(rows[0]); return { error: null }; } };
            }
          };
        }
      }
    },
    document: { getElementById(id) { return elements[id]; } },
    emailjs: { async send() {} },
    console, Date
  });
  run("script.js", context);
  const submit = { preventDefault() {} };
  elements.phone.value = "bad";
  await contactForm.listeners.submit(submit);
  assert.equal(records.length, 0);
  assert.match(elements["form-status"].textContent, /valid Indian mobile/);
  elements.phone.value = "+91 98765 43210";
  await contactForm.listeners.submit(submit);
  assert.equal(records[0].phone, "+919876543210");
  elements.phone.value = "";
  await contactForm.listeners.submit(submit);
  assert.equal(records[1].phone, null);
});

test("dashboard links do not log contact; only confirmed completed actions do", async () => {
  const elements = {};
  const inserted = [];
  let confirmed = false;
  const auth = { getUser() { return new Promise(() => {}); } };
  const client = {
    auth,
    from(table) {
      assert.equal(table, "inquiry_contact_history");
      return {
        insert(entry) {
          inserted.push(entry);
          return {
            select() {
              return { async single() { return { data: { ...entry, id: 1, created_at: "2026-01-01T00:00:00Z" }, error: null }; } };
            }
          };
        }
      };
    }
  };
  const context = vm.createContext({
    window: { RDContact: utilities(), supabase: { createClient() { return client; } } },
    document: {
      getElementById(id) { return elements[id] || (elements[id] = element()); },
      createElement() { return element(); }
    },
    confirm() { return confirmed; },
    console, Date
  });
  run("dashboard.js", context);
  vm.runInContext("contactHistoryAvailable = true", context);
  const card = context.createMessageCard({
    id: 42, name: "Priya", email: "priya@example.com", phone: "9876543210",
    message: "A website for my shop", created_at: "2026-01-01T00:00:00Z"
  });
  const actions = card.children[5];
  assert.deepEqual(actions.children.map((item) => item.textContent), ["Call", "WhatsApp", "Email"]);
  assert.equal(actions.children[0].href, "tel:+919876543210");
  assert.equal(inserted.length, 0);
  const history = card.children[6];
  const controls = history.children[2];
  controls.children[0].value = "WhatsApp";
  await controls.children[1].listeners.click();
  assert.equal(inserted.length, 0);
  confirmed = true;
  await controls.children[1].listeners.click();
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].channel, "WhatsApp");
  assert.equal(inserted[0].inquiry_id, 42);
  assert.match(history.children[1].children[0].textContent, /WhatsApp/);
});

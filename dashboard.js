
const SUPABASE_URL = "https://kmvmnojjbbgyuskymqju.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6DbvBmw-CwV1rt04HsLmtg_JHnWUoCd";

const ADMIN_USER_ID = "ed313df0-8ac0-4426-88ca-235ee0b735a6";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const statusElement = document.getElementById("dashboard-status");
const messageList = document.getElementById("message-list");
const totalCount = document.getElementById("total-count");
const latestCount = document.getElementById("latest-count");
const refreshButton = document.getElementById("refresh-btn");
const logoutButton = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-messages");
const statusFilter = document.getElementById("filter-status");
const filterCount = document.getElementById("filter-count");

let allInquiries = [];
let allContactHistory = [];
let contactHistoryAvailable = false;

document.getElementById("year").textContent = new Date().getFullYear();

function showStatus(message) {
  statusElement.textContent = message;
}

function formatDate(dateValue) {
  if (!dateValue) return "Date not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function filterMessages() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredInquiries = allInquiries.filter(function (inquiry) {
   const name = (inquiry.name || "").toLowerCase();
const email = (inquiry.email || "").toLowerCase();
const message = (inquiry.message || "").toLowerCase();
const status = inquiry.status || "New";

const matchesSearch =
  name.includes(searchTerm) ||
  email.includes(searchTerm) ||
  message.includes(searchTerm);
    const matchesStatus =
      selectedStatus === "All" || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  messageList.replaceChildren();

  filteredInquiries.forEach(function (inquiry) {
    messageList.appendChild(createMessageCard(inquiry));
  });

  filterCount.textContent =
    "Showing " + filteredInquiries.length +
    " of " + allInquiries.length + " messages.";

  if (filteredInquiries.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent =
      allInquiries.length === 0
        ? "No customer messages yet. ♡"
        : "No messages match your search or selected status.";

    messageList.appendChild(emptyMessage);
  }
}

function createMessageCard(inquiry) {
  const card = document.createElement("article");
  card.className = "message-card";

  const name = document.createElement("h3");
  name.textContent = inquiry.name || "Unnamed visitor";

  const email = document.createElement("p");
  email.className = "message-email";
  email.textContent = inquiry.email || "No email provided";

  const message = document.createElement("p");
  message.className = "message-text";
  message.textContent = inquiry.message || "No message provided";

  const date = document.createElement("p");
  date.className = "message-date";
  date.textContent = "Received: " + formatDate(inquiry.created_at);

  const phone = document.createElement("p");
  phone.className = "message-email";
  phone.textContent = inquiry.phone || "No phone number provided";

  const actions = document.createElement("div");
  actions.className = "contact-actions";
  const links = window.RDContact.contactLinks(inquiry);
  [
    ["Call", links.call],
    ["WhatsApp", links.whatsapp],
    ["Email", links.email]
  ].forEach(function (item) {
    if (!item[1]) {
      const unavailable = document.createElement("span");
      unavailable.textContent = item[0] + " unavailable";
      actions.appendChild(unavailable);
      return;
    }

    const link = document.createElement("a");
    link.textContent = item[0];
    link.href = item[1];
    if (item[0] === "WhatsApp") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    actions.appendChild(link);
  });

  const history = document.createElement("div");
  history.className = "contact-history";
  const historyTitle = document.createElement("strong");
  historyTitle.textContent = "Completed contact history";
  const historyList = document.createElement("ul");
  const historyStatus = document.createElement("p");
  historyStatus.setAttribute("role", "status");
  historyStatus.setAttribute("aria-live", "polite");

  function renderHistory() {
    historyList.replaceChildren();
    const entries = allContactHistory.filter(function (entry) {
      return String(entry.inquiry_id) === String(inquiry.id);
    });
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.textContent = "No completed contact recorded.";
      historyList.appendChild(empty);
      return;
    }
    entries.forEach(function (entry) {
      const line = document.createElement("li");
      line.textContent = entry.channel + " — " + formatDate(entry.created_at);
      historyList.appendChild(line);
    });
  }

  history.append(historyTitle, historyList);
  if (contactHistoryAvailable) {
    renderHistory();
    const controls = document.createElement("div");
    controls.className = "contact-history-controls";
    const channel = document.createElement("select");
    channel.setAttribute("aria-label", "Completed contact method");
    ["Call", "WhatsApp", "Email"].forEach(function (method) {
      const option = document.createElement("option");
      option.value = method;
      option.textContent = method;
      channel.appendChild(option);
    });
    const record = document.createElement("button");
    record.type = "button";
    record.textContent = "Record completed contact";
    record.addEventListener("click", async function () {
      if (!confirm("Record this " + channel.value + " as completed?")) return;
      record.disabled = true;
      historyStatus.textContent = "Saving contact history...";
      try {
        const { data, error } = await supabaseClient
          .from("inquiry_contact_history")
          .insert({ inquiry_id: inquiry.id, channel: channel.value })
          .select("id, inquiry_id, channel, created_at")
          .single();
        if (error) throw error;
        if (!data) throw new Error("Contact history was not returned.");
        allContactHistory.unshift(data);
        renderHistory();
        historyStatus.textContent = "Completed contact recorded.";
      } catch (error) {
        console.error("Could not save contact history:", error);
        historyStatus.textContent = "Could not save contact history. Please try again.";
      } finally {
        record.disabled = false;
      }
    });
    controls.append(channel, record);
    history.appendChild(controls);
  } else {
    historyStatus.textContent = "Contact history is unavailable. Refresh to try again.";
  }
  history.appendChild(historyStatus);

  // Status controls
  const statusLabel = document.createElement("label");
  statusLabel.textContent = "Inquiry status: ";
  statusLabel.style.display = "block";
  statusLabel.style.marginTop = "16px";
  statusLabel.style.marginBottom = "8px";
  statusLabel.style.fontWeight = "600";

  const statusSelect = document.createElement("select");
  statusSelect.style.padding = "10px";
  statusSelect.style.borderRadius = "8px";
  statusSelect.style.border = "1px solid #d8cfc2";
  statusSelect.style.background = "#FFFCF7";
  statusSelect.style.color = "#493A33";

  ["New", "Read", "Replied"].forEach(function (status) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  });

  statusSelect.value = inquiry.status || "New";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save Status";
  saveButton.style.marginTop = "10px";

  const statusMessage = document.createElement("p");
  statusMessage.style.marginTop = "8px";
  statusMessage.style.fontSize = "13px";
  statusMessage.setAttribute("role", "status");

  saveButton.addEventListener("click", async function () {
    saveButton.disabled = true;
    statusMessage.textContent = "Saving status...";

    try {
      const { data, error } = await supabaseClient
        .from("inquiries")
        .update({ status: statusSelect.value })
        .eq("id", inquiry.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No inquiry was updated.");
      }

      inquiry.status = statusSelect.value;
      statusMessage.textContent = "Status saved successfully! ♡";
    } catch (error) {
      console.error("Status update error:", error);
      statusMessage.textContent = "Could not save status. Please try again.";
    } finally {
      saveButton.disabled = false;
    }
  });

  statusLabel.appendChild(statusSelect);

  // Delete button
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete Message 🗑️";
  deleteButton.className = "delete-btn";
  deleteButton.style.display = "block";

  deleteButton.addEventListener("click", async function () {
    const confirmed = confirm(
      "Are you sure you want to permanently delete this message?"
    );

    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    try {
      const { data, error } = await supabaseClient
        .from("inquiries")
        .delete()
        .eq("id", inquiry.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No message was deleted. Check permissions.");
      }

      allInquiries = allInquiries.filter(function (item) {
        return item.id !== inquiry.id;
      });

      filterMessages();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Message delete nahi hua. Please try again.");
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete Message 🗑️";
    }
  });

  card.append(
    name,
    email,
    phone,
    message,
    date,
    actions,
    history,
    statusLabel,
    saveButton,
    statusMessage,
    deleteButton
  );

  return card;
}

async function loadMessages() {
  refreshButton.disabled = true;
  messageList.replaceChildren();
  showStatus("Loading customer messages...");

  try {
    const { data, error } = await supabaseClient
      .from("inquiries")
.select("id, name, email, phone, message, created_at, status")
   .order("created_at", { ascending: false });

    if (error) throw error;

    totalCount.textContent = data.length;
    allInquiries = data;
    latestCount.textContent = Math.min(data.length, 5);

    allContactHistory = [];
    contactHistoryAvailable = false;
    try {
      const pageSize = 500;
      let page = 0;
      let entries;
      do {
        const result = await supabaseClient
          .from("inquiry_contact_history")
          .select("id, inquiry_id, channel, created_at")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (result.error) throw result.error;
        entries = result.data;
        allContactHistory.push(...entries);
        page++;
      } while (entries.length === pageSize);
      contactHistoryAvailable = true;
      showStatus("Customer messages loaded successfully.");
    } catch (historyError) {
      console.error("Could not load contact history:", historyError);
      showStatus("Messages loaded, but contact history could not be loaded. Refresh to try again.");
    }
filterMessages();}
    catch (error) {
    console.error("Could not load inquiries:", error);
    showStatus(
      "Messages could not be loaded. Check your connection and Supabase permissions, then refresh."
    );
  } finally {
    refreshButton.disabled = false;
  }
}

async function checkAdminSession() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user || data.user.id !== ADMIN_USER_ID) {
      await supabaseClient.auth.signOut();
      window.location.replace("admin.html");
      return;
    }

    await loadMessages();
  } catch (error) {
    console.error("Session check failed:", error);
    window.location.replace("admin.html");
  }
}

refreshButton.addEventListener("click", loadMessages);

logoutButton.addEventListener("click", async function () {
  logoutButton.disabled = true;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    showStatus("Logout failed. Please try again.");
    logoutButton.disabled = false;
    return;
  }

  window.location.replace("admin.html");
});

searchInput.addEventListener("input", filterMessages);
statusFilter.addEventListener("change", filterMessages);

checkAdminSession();

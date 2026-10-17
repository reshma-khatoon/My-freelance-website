
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
        throw new Error("No inquiry was updated. Check the table ID and permissions.");
      }

      inquiry.status = statusSelect.value;
      statusMessage.textContent = "Status saved successfully! ♡";
    } catch (error) {
      console.error("Status update error:", error);
      statusMessage.textContent =
        "Could not save status. Please check the inquiry ID and Supabase permissions.";
    } finally {
      saveButton.disabled = false;
    }
  });

  statusLabel.appendChild(statusSelect);

  card.append(
    name,
    email,
    message,
    date,
    statusLabel,
    saveButton,
    statusMessage
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
.select("id, name, email, message, created_at, status")   
   .order("created_at", { ascending: false });

    if (error) throw error;

    totalCount.textContent = data.length;
    allInquiries = data;
    latestCount.textContent = Math.min(data.length, 5);

   showStatus("Customer messages loaded successfully.");
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

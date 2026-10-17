
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

  card.append(name, email, message, date);

  return card;
}

async function loadMessages() {
  refreshButton.disabled = true;
  messageList.replaceChildren();
  showStatus("Loading customer messages...");

  try {
    const { data, error } = await supabaseClient
      .from("inquiries")
      .select("name, email, message, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    totalCount.textContent = data.length;
    latestCount.textContent = Math.min(data.length, 5);

    if (data.length === 0) {
      showStatus("No customer messages yet. New inquiries will appear here.");
      return;
    }

    data.forEach(function (inquiry) {
      messageList.appendChild(createMessageCard(inquiry));
    });

    showStatus("Showing " + data.length + " customer message(s).");
  } catch (error) {
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

checkAdminSession();

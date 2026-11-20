const SUPABASE_URL = "https://kmvmnojjbbgyuskymqju.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6DbvBmw-CwV1rt04HsLmtg_JHnWUoCd";
const ADMIN_USER_ID = "ed313df0-8ac0-4426-88ca-235ee0b735a6";

const resetForm = document.getElementById("reset-form");
const resetStatus = document.getElementById("reset-status");
const resetButton = document.getElementById("reset-btn");
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
let recoveryAuthorized = false;

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storageKey: "rd-studio-password-recovery",
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

supabaseClient.auth.onAuthStateChange(function (event, session) {
  if (event === "PASSWORD_RECOVERY" && session) {
    // Supabase auth calls must run outside the auth state callback.
    setTimeout(authorizeRecovery, 0);
  } else if (event === "INITIAL_SESSION" && !recoveryAuthorized) {
    resetStatus.textContent =
      "Open a valid recovery link to reset your password. If the link expired or this page was refreshed, request a new one from Admin Login.";
  } else if (event === "SIGNED_OUT") {
    recoveryAuthorized = false;
    resetForm.hidden = true;
  }
});

async function authorizeRecovery() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    if (!data.user || data.user.id !== ADMIN_USER_ID) {
      resetStatus.textContent = "This recovery link is not authorized for the admin account.";
      return;
    }
    recoveryAuthorized = true;
    resetForm.hidden = false;
    resetStatus.textContent = "Enter your new password.";
  } catch (error) {
    console.error("Recovery session verification failed:", error);
    resetStatus.textContent = "Could not verify the recovery link. Please request a new one.";
  }
}

document.getElementById("show-password").addEventListener("change", function (event) {
  const type = event.target.checked ? "text" : "password";
  newPassword.type = type;
  confirmPassword.type = type;
});

resetForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!recoveryAuthorized) {
    resetStatus.textContent = "A valid admin recovery link is required.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    resetStatus.textContent = "Passwords do not match.";
    return;
  }

  resetButton.disabled = true;
  resetStatus.textContent = "Updating password...";
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    recoveryAuthorized = false;
    resetForm.hidden = true;
    resetForm.reset();
    resetStatus.textContent = "Password updated successfully. Redirecting to Admin Login...";
    setTimeout(function () { window.location.replace("admin.html"); }, 2500);
  } catch (error) {
    console.error("Password update failed:", error);
    resetStatus.textContent = error.message || "Could not update the password. Please try again.";
  } finally {
    resetButton.disabled = false;
  }
});

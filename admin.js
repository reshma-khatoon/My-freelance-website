
const SUPABASE_URL = "https://kmvmnojjbbgyuskymqju.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6DbvBmw-CwV1rt04HsLmtg_JHnWUoCd";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.getElementById("admin-login-form");
const loginButton = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");
const recoveryForm = document.getElementById("recovery-form");
const recoveryButton = document.getElementById("recovery-btn");
const recoveryStatus = document.getElementById("recovery-status");

document.getElementById("forgot-password-link").addEventListener("click", function (event) {
  event.preventDefault();
  recoveryForm.hidden = !recoveryForm.hidden;
  if (!recoveryForm.hidden) {
    document.getElementById("recovery-email").value =
      document.getElementById("admin-email").value.trim();
    document.getElementById("recovery-email").focus();
  }
});

recoveryForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  recoveryButton.disabled = true;
  recoveryStatus.textContent = "";

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      document.getElementById("recovery-email").value.trim(),
      { redirectTo: "https://mywebsite-xi-ashy.vercel.app/reset-password.html" }
    );

    if (error) throw error;
    recoveryStatus.textContent =
      "If an account exists for that email, a recovery link has been sent.";
  } catch (error) {
    console.error("Password recovery request failed:", error);
    recoveryStatus.textContent = "Could not send the recovery link. Please try again.";
  } finally {
    recoveryButton.disabled = false;
  }
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  loginStatus.textContent = "";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (
      !data.user ||
      data.user.id !== "ed313df0-8ac0-4426-88ca-235ee0b735a6"
    ) {
      await supabaseClient.auth.signOut();
      throw new Error("This account is not authorized as the admin.");
    }

    loginStatus.textContent = "Login successful! Opening dashboard... ♡";

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Admin login error:", error);
    loginStatus.textContent =
      error.message === "This account is not authorized as the admin."
        ? "This account is not authorized."
        : "Login failed. Please check your email and password.";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In ♡";
  }
});


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

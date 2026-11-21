
const SUPABASE_URL = "https://kmvmnojjbbgyuskymqju.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6DbvBmw-CwV1rt04HsLmtg_JHnWUoCd";

// Connect to Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    // Public form must always use the anon role, even if admin is logged in
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Automatically update footer year
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Pricing buttons: scroll to contact and prefill the message
(document.querySelectorAll ? document.querySelectorAll(".pricing-btn") : []).forEach(function (btn) {
  btn.addEventListener("click", function (event) {
    event.preventDefault();
    const contact = document.getElementById("contact");
    const box = document.getElementById("message");
    const pkg = btn.dataset.package;

    if (box && pkg) {
      const text = pkg === "Custom"
        ? "Hi! I'd like to discuss a custom package. "
        : "Hi! I'm interested in the " + pkg + " package. ";
      const existing = box.value.replace(/^Hi! I'(m interested in the \w+ package|d like to discuss a custom package)\. ?/, "");
      box.value = text + existing;
    }

    if (contact) contact.scrollIntoView({ behavior: "smooth" });
    if (box) setTimeout(function () { box.focus({ preventScroll: true }); }, 600);
  });
});

// RD Studio Contact Form
const contactForm = document.getElementById("contact-form");
const submitButton = document.getElementById("submit-btn");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("from_name").value.trim();
    const email = document.getElementById("from_email").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();
    const phone = phoneInput ? window.RDContact.normalizeIndianPhone(phoneInput) : null;
    const message = document.getElementById("message").value.trim();

    if (name.length < 2 || name.length > 80) {
  formStatus.textContent =
    "Please enter a name between 2 and 80 characters.";
  return;
}

if (email.length > 254) {
  formStatus.textContent = "Please enter a shorter email address.";
  return;
}

if (phoneInput && !phone) {
  formStatus.textContent = "Please enter a valid Indian mobile number, or leave the phone field blank.";
  return;
}

if (message.length < 10 || message.length > 3000) {
  formStatus.textContent =
    "Your message should be between 10 and 3000 characters.";
  return;
}

    if (!name || !email || !message) {
      formStatus.textContent = "Please fill in all fields. 🌷";
      return;
    }

    if (!window.emailjs) {
      formStatus.textContent =
        "Email service is unavailable. Please try again later.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending... 💌";
    formStatus.textContent = "";

    let databaseSaved = false;
    let emailSent = false;

    try {
      // 1. Save the inquiry in Supabase
      try {
        const inquiry = { name: name, email: email, message: message };
        if (phone) inquiry.phone = phone;
        const { error } = await supabaseClient
          .from("inquiries")
          .insert([inquiry]);

        if (error) {
          throw error;
        }

        databaseSaved = true;
        console.log("Inquiry saved in Supabase.");
      } catch (error) {
        console.error("Supabase Error:", error);
        console.log("Supabase error details:", JSON.stringify(error, null, 2));
      }

      // 2. Send the email using existing EmailJS setup
      try {
        await emailjs.send(
          "service_xhm40ql",
          "template_zz78gjf",
          {
            from_name: name,
            from_email: email,
            message: phone ? message + "\n\nPhone: " + phone : message
          },
          {
            publicKey: "VI3oZ8d8572fidLrN"
          }
        );

        emailSent = true;
        console.log("Email sent successfully.");
      } catch (error) {
        console.error("EmailJS Error:", error);
      }

      // 3. Show the actual result
      if (databaseSaved && emailSent) {
        formStatus.textContent =
          "Thank you! Your message has been sent successfully. 💌";
        contactForm.reset();
      } else if (databaseSaved && !emailSent) {
        formStatus.textContent =
          "Your message was saved, but the email could not be sent. Please contact us again later.";
      } else if (!databaseSaved && emailSent) {
        formStatus.textContent =
          phone
            ? "Your message was emailed, but database saving failed. Please contact the website owner directly about your phone number; do not submit again."
            : "Your email was sent, but database saving failed. Please do not submit again; contact the website owner.";
      } else {
        formStatus.textContent =
          "Your message could not be saved or emailed. Please contact the website owner directly; do not submit again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send a little note ♡";
    }
  });
}


const SUPABASE_URL = "https://kmvmnojjbbgyuskymqju.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6DbvBmw-CwV1rt04HsLmtg_JHnWUoCd";

// Connect to Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Automatically update footer year
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// RD Studio Contact Form
const contactForm = document.getElementById("contact-form");
const submitButton = document.getElementById("submit-btn");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("from_name").value.trim();
    const email = document.getElementById("from_email").value.trim();
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
        const { error } = await supabaseClient
          .from("inquiries")
          .insert([
            {
              name: name,
              email: email,
              message: message
            }
          ]);

        if (error) {
          throw error;
        }

        databaseSaved = true;
        console.log("Inquiry saved in Supabase.");
      } catch (error) {
        console.error("Supabase Error:", error);
      }

      // 2. Send the email using existing EmailJS setup
      try {
        await emailjs.send(
          "service_xhm40ql",
          "template_zz78gjf",
          {
            from_name: name,
            from_email: email,
            message: message
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
          "Your email was sent, but database saving failed. Please do not submit again; contact the website owner.";
      } else {
        formStatus.textContent =
          "Sorry, your message could not be processed. Please try again later.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send a little note ♡";
    }
  });
}

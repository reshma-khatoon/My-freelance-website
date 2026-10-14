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
  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("from_name").value.trim();
    const email = document.getElementById("from_email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      formStatus.textContent = "Please fill in all fields. 🌷";
      return;
    }

    if (!window.emailjs) {
      formStatus.textContent =
        "Email service is not connected yet. Please try again later.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending... 💌";
    formStatus.textContent = "";

    emailjs
      .send(
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
      )
      .then(function (response) {
  console.log("EmailJS status:", response.status);
  console.log("EmailJS response:", response.text);

  formStatus.textContent =
    "EmailJS response: " + response.status + " " + response.text;

  contactForm.reset();
})
      .catch(function (error) {
  console.error("EmailJS Error:", error);

  formStatus.textContent =
    "Email failed: " +
    (error?.text || error?.message || "Please try again.");
})
      .finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = "Send a little note ♡";
      });
  });
}
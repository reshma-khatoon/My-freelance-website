(function () {
  function normalizeIndianPhone(value) {
    const compact = value.trim().replace(/[\s()-]/g, "");
    const match = compact.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
    return match ? "+91" + match[1] : null;
  }

  function contactLinks(inquiry) {
    const name = (inquiry.name || "").trim() || "there";
    const details = (inquiry.message || "").trim();
    const summary = details.replace(/\s+/g, " ").slice(0, 80);
    const body = "Hello " + name + ",\n\n" +
      "Thank you for contacting RD Studio!\n\n" +
      "Regarding your inquiry:\n" + details + "\n\n" +
      "I would love to discuss your requirements and help you further.\n\n" +
      "Regards,\nRD Studio";
    const phone = normalizeIndianPhone(inquiry.phone || "");
    const email = (inquiry.email || "").trim();
    const validEmail = /^[^\s@,;?&#]+@[^\s@,;?&#]+\.[^\s@,;?&#]+$/.test(email);

    return {
      call: phone ? "tel:" + phone : null,
      whatsapp: phone
        ? "https://wa.me/" + phone.slice(1) + "?text=" + encodeURIComponent(body)
        : null,
      email: validEmail
        ? "mailto:" + encodeURIComponent(email).replace(/%40/g, "@") +
          "?subject=" + encodeURIComponent("RD Studio: " + (summary || "Your inquiry")) +
          "&body=" + encodeURIComponent(body)
        : null
    };
  }

  window.RDContact = { normalizeIndianPhone, contactLinks };
})();

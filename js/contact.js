/* Contact form submission handler — posts to a Google Apps Script Web App
   that appends rows to a Google Sheet. See google-apps-script/README.md. */
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = "form-status show " + type;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus("Please fill out all required fields.", "error");
      return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }

    // reCAPTCHA check — only proceeds if the checkbox has been completed.
    var recaptchaToken = "";
    if (typeof grecaptcha !== "undefined") {
      recaptchaToken = grecaptcha.getResponse();
      if (!recaptchaToken) {
        setStatus("Please confirm you're not a robot.", "error");
        return;
      }
    }

    var webAppUrl = window.SITE_CONFIG && window.SITE_CONFIG.GOOGLE_SHEETS_WEB_APP_URL;
    if (!webAppUrl || webAppUrl.indexOf("PASTE_YOUR") === 0) {
      setStatus("Form is not yet connected. Add your Google Apps Script URL in js/config.js.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Sending your message...", "sending");

    var payload = {
      name: name,
      email: email,
      message: message,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      recaptchaToken: recaptchaToken
    };

    // Apps Script web apps require "text/plain" (or a simple form-encoded
    // request) to avoid a CORS preflight, since the response cannot set
    // custom preflight headers. We send JSON as text/plain and parse it
    // server-side with JSON.parse(e.postData.contents).
    fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () {
          // Response wasn't readable JSON (can happen with some deployment
          // configs) — treat a completed request as success, same as before.
          return { result: "success" };
        });
      })
      .then(function (data) {
        if (typeof grecaptcha !== "undefined") {
          grecaptcha.reset();
        }
        if (data && data.result === "error") {
          setStatus(data.message || "Something went wrong sending your message. Please try again.", "error");
          return;
        }
        form.reset();
        setStatus("Thanks! Your message has been sent. We'll be in touch soon.", "success");
      })
      .catch(function () {
        if (typeof grecaptcha !== "undefined") {
          grecaptcha.reset();
        }
        setStatus("Something went wrong sending your message. Please try again or email us directly.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
});

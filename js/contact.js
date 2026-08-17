/* Contact form submission handler — posts to a Google Apps Script Web App */
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = "form-status show " + type;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();

    // 1. Basic Validation
    if (!name || !email || !message) {
      setStatus("Please fill out all required fields.", "error");
      return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }

    var webAppUrl = window.SITE_CONFIG && window.SITE_CONFIG.GOOGLE_SHEETS_WEB_APP_URL;
    if (!webAppUrl || webAppUrl.indexOf("PASTE_YOUR") === 0) {
      setStatus("Form is not yet connected. Add your Google Apps Script URL in js/config.js.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Verifying security...", "sending");

    var recaptchaToken = "";

    // 2. Strict reCAPTCHA Enterprise Check
    if (typeof grecaptcha === "undefined" || !grecaptcha.enterprise) {
      setStatus("Security check is still loading or blocked by your browser. Please refresh and try again.", "error");
      submitBtn.disabled = false;
      return;
    }

    try {
      // Force the wait to get the token
      recaptchaToken = await grecaptcha.enterprise.execute("6LeCnootAAAAALlaIyzbwRQHKXlcAjwJs-1LLWN6", { action: "submit_form" });
      
      if (!recaptchaToken) {
        setStatus("Could not generate a security token. Please try again.", "error");
        submitBtn.disabled = false;
        return;
      }
    } catch (err) {
      console.error("reCAPTCHA execution error:", err);
      setStatus("reCAPTCHA generation failed. Please check the browser console.", "error");
      submitBtn.disabled = false;
      return;
    }

    setStatus("Sending your message...", "sending");

    var payload = {
      name: name,
      email: email,
      message: message,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      recaptchaToken: recaptchaToken // Include the verified token
    };

    // 3. Send to Google Apps Script
    fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { result: "success" };
        });
      })
      .then(function (data) {
        if (data && data.result === "error") {
          setStatus(data.message || "Something went wrong sending your message. Please try again.", "error");
          return;
        }
        form.reset();
        setStatus("Thanks! Your message has been sent. We'll be in touch soon.", "success");
      })
      .catch(function () {
        setStatus("Something went wrong sending your message. Please try again or email us directly.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
});

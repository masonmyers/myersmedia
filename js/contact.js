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
      setStatus("Form is not yet connected.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Verifying and sending...", "sending");

    var recaptchaToken = "";

    // 1. Generate the reCAPTCHA Enterprise Token on the frontend
    if (typeof grecaptcha !== "undefined" && grecaptcha.enterprise) {
      try {
        recaptchaToken = await grecaptcha.enterprise.execute("6LfmhIotAAAAALxF99_Gw1UdXuJJerqU4XHP0SZw", { action: "submit_form" });
        if (!recaptchaToken) {
          setStatus("Please confirm you're not a robot.", "error");
          submitBtn.disabled = false;
          return;
        }
      } catch (err) {
        console.error("reCAPTCHA error:", err);
        setStatus("reCAPTCHA verification error. Please try again.", "error");
        submitBtn.disabled = false;
        return;
      }
    }

    var payload = {
      name: name,
      email: email,
      message: message,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      recaptchaToken: recaptchaToken // Pass the token to the backend
    };

    // 2. Send data to Google Apps Script
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
          setStatus(data.message || "Something went wrong sending your message.", "error");
          return;
        }
        form.reset();
        setStatus("Thanks! Your message has been sent. We'll be in touch soon.", "success");
      })
      .catch(function () {
        setStatus("Something went wrong sending your message. Please try again.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
});

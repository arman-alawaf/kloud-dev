/*
 * Project JavaScript entry file.
 * Keep custom interactive code here to avoid inline scripts in HTML.
 */

(function initFaqAccordion() {
  var accordion = document.querySelector("[data-faq-accordion]");
  if (!accordion) return;

  var plusIcon = "./assets/img/plus.png";
  var minusIcon = "./assets/img/minus.png";
  var items = Array.from(accordion.querySelectorAll("[data-faq-item]"));

  function setItemState(item, isOpen) {
    var answer = item.querySelector("[data-faq-answer]");
    var toggle = item.querySelector("[data-faq-toggle]");
    var icon = item.querySelector("[data-faq-icon]");
    if (!answer || !toggle || !icon) return;

    answer.classList.toggle("d-none", !isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    icon.setAttribute("src", isOpen ? minusIcon : plusIcon);
    icon.setAttribute("alt", isOpen ? "Collapse FAQ answer" : "Expand FAQ answer");
  }

  function openOnly(targetItem) {
    items.forEach(function (item) {
      setItemState(item, item === targetItem);
    });
  }

  items.forEach(function (item) {
    var toggle = item.querySelector("[data-faq-toggle]");
    if (!toggle) return;

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      openOnly(item);
    });
  });
})();

(function initDirectionTabs() {
  var tabsRoot = document.querySelector("[data-tabs]");
  if (!tabsRoot) return;

  var triggers = Array.from(tabsRoot.querySelectorAll("[data-tab-trigger]"));
  var panels = Array.from(tabsRoot.querySelectorAll("[data-tab-panel]"));

  function setActiveTab(tabName) {
    triggers.forEach(function (trigger) {
      var isActive = trigger.getAttribute("data-tab-trigger") === tabName;
      trigger.classList.toggle("ux-inline-21", isActive);
      trigger.classList.toggle("ux-inline-22", !isActive);
      trigger.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach(function (panel) {
      var isActive = panel.getAttribute("data-tab-panel") === tabName;
      panel.classList.toggle("d-none", !isActive);
    });
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      setActiveTab(trigger.getAttribute("data-tab-trigger"));
    });
  });
})();

(function initPackageSelectionAndValidation() {
  var packageSelect = document.getElementById("package-select");
  var callbackForm = document.getElementById("request-callback-form");
  if (!packageSelect || !callbackForm) return;
  var phoneField = callbackForm.querySelector('input[name="phone"]');
  var bdPhoneRegex = /^01[0-9]{9}$/;
  var statusWrap = document.getElementById("callback-form-status-wrap");
  var statusEl = document.getElementById("callback-form-status");
  var submitBtn = document.getElementById("callback-submit-btn");

  var packageLinks = Array.from(document.querySelectorAll("[data-package-link]"));

  packageLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var packageKey = link.getAttribute("data-package-link");
      if (!packageKey) return;
      packageSelect.value = packageKey;
    });
  });

  function setStatus(message, kind) {
    if (!statusWrap || !statusEl) return;
    statusWrap.classList.remove("d-none");
    statusEl.textContent = message;
    statusEl.classList.remove("text-success", "text-danger");
    if (kind === "success") {
      statusEl.classList.add("text-success");
    } else if (kind === "error") {
      statusEl.classList.add("text-danger");
    }
  }

  function clearStatus() {
    if (!statusWrap || !statusEl) return;
    statusEl.textContent = "";
    statusWrap.classList.add("d-none");
    statusEl.classList.remove("text-success", "text-danger");
  }

  function resolveCallbackEndpoint(rawPath) {
    try {
      return new URL(rawPath, window.location.href).href;
    } catch (e1) {
      return rawPath;
    }
  }

  function errorMessageForNonJsonResponse(status) {
    if (status === 404) {
      return "The mail script was not found. Deploy the server/ folder with PHP on your host, or set data-callback-endpoint on the form to the full URL of send-callback.php.";
    }
    if (status === 405 || status === 403) {
      return "The server blocked this request. Check that send-callback.php allows POST and PHP is enabled.";
    }
    if (status >= 500) {
      return "The server returned an error (" + status + "). Check PHP error logs and mail configuration.";
    }
    if (status === 0) {
      return "No response from server (blocked or offline).";
    }
    return "The server did not return valid JSON (" + status + ").";
  }

  callbackForm.addEventListener("submit", function (event) {
    clearStatus();

    if (window.location.protocol === "file:") {
      event.preventDefault();
      setStatus(
        "This form cannot send mail when the page is opened as a local file. Upload the site to HTTPS hosting with PHP, or use a local server (e.g. PHP built-in server) that includes server/send-callback.php.",
        "error"
      );
      return;
    }

    var requiredFields = Array.from(callbackForm.querySelectorAll("[required]"));
    requiredFields.forEach(function (field) {
      if (field.tagName === "INPUT") {
        field.value = field.value.trim();
      }
    });

    if (phoneField) {
      phoneField.value = phoneField.value.replace(/\s+/g, "");
      if (!bdPhoneRegex.test(phoneField.value)) {
        phoneField.setCustomValidity("Please enter a valid Bangladesh mobile number (11 digits), e.g. 01632109022.");
      } else {
        phoneField.setCustomValidity("");
      }
    }

    if (!callbackForm.checkValidity()) {
      event.preventDefault();
      callbackForm.reportValidity();
      return;
    }

    event.preventDefault();

    var endpointRaw =
      callbackForm.getAttribute("data-callback-endpoint") || callbackForm.getAttribute("action") || "server/send-callback.php";
    var endpointResolved = resolveCallbackEndpoint(endpointRaw);
    var crossOrigin = (function () {
      try {
        return new URL(endpointResolved).origin !== window.location.origin;
      } catch (e2) {
        return false;
      }
    })();
    var body = new FormData(callbackForm);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalLabel = submitBtn.dataset.originalLabel || submitBtn.textContent;
      submitBtn.textContent = "Sending…";
    }

    fetch(endpointResolved, {
      method: "POST",
      body: body,
      credentials: crossOrigin ? "omit" : "same-origin",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          if (text) {
            try {
              data = JSON.parse(text);
            } catch (parseErr) {
              data = {
                ok: false,
                error: errorMessageForNonJsonResponse(res.status),
              };
            }
          } else {
            data = { ok: false, error: errorMessageForNonJsonResponse(res.status) };
          }
          return { res: res, data: data };
        });
      })
      .then(function (result) {
        if (result.data && result.data.ok === true) {
          setStatus(result.data.message || "Thank you. We will contact you soon.", "success");
          callbackForm.reset();
          if (packageSelect) {
            packageSelect.selectedIndex = 0;
          }
          return;
        }
        var err =
          (result.data && result.data.error) ||
          errorMessageForNonJsonResponse(result.res ? result.res.status : 0);
        setStatus(err, "error");
      })
      .catch(function (err) {
        var msg = "Could not reach the server.";
        if (err && err.name === "TypeError") {
          msg =
            "Network or CORS error. If the form API is on another domain, add CALLBACK_ALLOWED_ORIGINS in server/.env with this site’s URL (https://…) and redeploy PHP.";
        }
        setStatus(msg, "error");
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalLabel || "Submit Request";
        }
      });
  });

  if (phoneField) {
    phoneField.addEventListener("input", function () {
      phoneField.value = phoneField.value.replace(/[^\d]/g, "");
      if (bdPhoneRegex.test(phoneField.value)) {
        phoneField.setCustomValidity("");
      }
    });
  }
})();

(function initBackToTop() {
  var backToTopLink = document.getElementById("back-to-top-link");
  if (!backToTopLink) return;

  function toggleBackToTopVisibility() {
    var shouldShow = window.scrollY > 280;
    backToTopLink.classList.toggle("is-visible", shouldShow);
  }

  backToTopLink.addEventListener("click", function (event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleBackToTopVisibility, { passive: true });
  toggleBackToTopVisibility();
})();


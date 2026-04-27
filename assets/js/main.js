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

  var packageLinks = Array.from(document.querySelectorAll("[data-package-link]"));

  packageLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var packageKey = link.getAttribute("data-package-link");
      if (!packageKey) return;
      packageSelect.value = packageKey;
    });
  });

  callbackForm.addEventListener("submit", function (event) {
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


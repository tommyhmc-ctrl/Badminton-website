const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const page = document.body.dataset.page;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const announcementConfig = {
  title: "Pickleball Court Booking",
  tag: "Reminder",
  body: [
    "We are pleased to offer pickleball court reservations through our online booking system.",
    "To reserve a pickleball court, please select Courts 19–22 using our online booking system and kindly write the note: \"Pickleball\" for our references.",
    "Thank you for your cooperation, and we look forward to welcoming you at Vision Badminton!"
  ],
  primaryLabel: "Book Now",
  primaryHref: "https://visionbadminton.skedda.com/",
  secondaryLabel: "Close",
};

if (page) {
  document.querySelector(`[data-nav="${page}"]`)?.classList.add("is-active");
}

// Hide header on scroll down, show on scroll up
const siteHeader = document.querySelector(".site-header");
let lastScrollY = window.scrollY;
window.addEventListener("scroll", () => {
  const current = window.scrollY;
  if (current > lastScrollY && current > 80) {
    siteHeader.classList.add("header-hidden");
  } else {
    siteHeader.classList.remove("header-hidden");
  }
  lastScrollY = current;
}, { passive: true });

function closeNav() {
  if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  if (navLinks) navLinks.classList.remove("open");
  document.querySelectorAll(".nav-dropdown").forEach((d) => d.classList.remove("dropdown-open"));
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("open", !expanded);
    if (expanded) {
      // Nav just closed — reset all dropdowns
      document.querySelectorAll(".nav-dropdown").forEach((d) => d.classList.remove("dropdown-open"));
    }
  });

  // Close nav on non-dropdown link clicks
  navLinks.querySelectorAll("a").forEach((link) => {
    const isDropdownTrigger = link.parentElement.classList.contains("nav-dropdown");
    if (isDropdownTrigger) return;
    link.addEventListener("click", closeNav);
  });
}

// Mobile dropdown: tap trigger to expand/collapse submenu
document.querySelectorAll(".nav-dropdown > a").forEach((trigger) => {
  const toggle = (e) => {
    if (!window.matchMedia("(max-width: 860px)").matches) return;
    e.preventDefault();
    e.stopPropagation();
    const dropdown = trigger.closest(".nav-dropdown");
    const isOpen = dropdown.classList.contains("dropdown-open");
    document.querySelectorAll(".nav-dropdown").forEach((d) => d.classList.remove("dropdown-open"));
    if (!isOpen) dropdown.classList.add("dropdown-open");
  };
  trigger.addEventListener("touchstart", toggle, { passive: false });
  trigger.addEventListener("click", toggle);
});

// Close nav when a submenu item is tapped
document.querySelectorAll(".nav-dropdown-menu a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("[type=submit]");
    const success = form.querySelector(".form-success");
    const originalLabel = submit ? submit.textContent : null;

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Sending…";
    }

    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        if (success) success.hidden = false;
        form.reset();
      } else {
        alert("Something went wrong. Please try again or call us directly.");
      }
    } catch {
      alert("Could not send — please check your connection and try again.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    }
  });
});

if (!document.querySelector(".page-transition")) {
  const transitionLayer = document.createElement("div");
  transitionLayer.className = "page-transition";
  document.body.appendChild(transitionLayer);
}

if (page === "pickleball" && !document.querySelector(".announcement-overlay")) {
  // Sanitise config values before injecting into DOM
  function safeText(str) {
    const el = document.createElement("span");
    el.textContent = String(str);
    return el.textContent;
  }
  function safeHref(str) {
    const s = String(str);
    return (s.startsWith("http://") || s.startsWith("https://") || s.endsWith(".html")) ? s : "#";
  }

  const overlay = document.createElement("div");
  overlay.className = "announcement-overlay";

  const modal = document.createElement("div");
  modal.className = "announcement-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "announcement-title");

  const head = document.createElement("div");
  head.className = "announcement-head";

  const headText = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = safeText(announcementConfig.tag);
  const title = document.createElement("h2");
  title.id = "announcement-title";
  title.textContent = safeText(announcementConfig.title);
  headText.append(eyebrow, title);

  const closeBtn = document.createElement("button");
  closeBtn.className = "announcement-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close announcement");
  closeBtn.textContent = "×";

  head.append(headText, closeBtn);

  const body = document.createElement("div");
  body.className = "announcement-body";
  announcementConfig.body.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = safeText(line);
    body.appendChild(p);
  });

  const actions = document.createElement("div");
  actions.className = "announcement-actions";
  const primaryLink = document.createElement("a");
  primaryLink.className = "button";
  primaryLink.href = safeHref(announcementConfig.primaryHref);
  primaryLink.textContent = safeText(announcementConfig.primaryLabel);
  const dismissBtn = document.createElement("button");
  dismissBtn.className = "button button-secondary announcement-dismiss";
  dismissBtn.type = "button";
  dismissBtn.textContent = safeText(announcementConfig.secondaryLabel);
  actions.append(primaryLink, dismissBtn);

  modal.append(head, body, actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeAnnouncement = () => {
    overlay.classList.remove("is-open");
  };

  overlay.querySelector(".announcement-close")?.addEventListener("click", closeAnnouncement);
  overlay.querySelector(".announcement-dismiss")?.addEventListener("click", closeAnnouncement);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeAnnouncement();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAnnouncement();
    }
  });

  window.setTimeout(() => {
    overlay.classList.add("is-open");
  }, reduceMotion ? 0 : 180);
}

if (!reduceMotion) {
  document.body.classList.add("is-entering");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("is-entering-ready");
      window.setTimeout(() => {
        document.body.classList.remove("is-entering", "is-entering-ready");
      }, 420);
    });
  });

  const revealTargets = document.querySelectorAll(
    ".section .info-card, .section .feature-row, .section .program-detail, .section .coach-card, .section .pricing-card, .section .panel, .section .stat-card, .cta-band"
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });

  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = link.getAttribute("target");

      if (!href || target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (href.startsWith("http")) {
        return;
      }

      event.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = href;
      }, 260);
    });
  });
}

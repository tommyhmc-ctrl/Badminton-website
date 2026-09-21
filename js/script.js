const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const page = document.body.dataset.page;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// Booking disclaimer modal
(function () {
  const disclaimerRules = [
    {
      title: "4% Processing Fee on Online Bookings",
      body: "All online bookings are subject to a 4% processing fee.",
    },
    {
      title: "Late Cancellation",
      body: "A 100% cancellation fee equal to the full court booking price applies to any cancellation made within 24 hours of the booked time.",
    },
    {
      title: "Empty Court Usage",
      body: "Any individual that is not a drop-in individual is not permitted to use empty courts.",
    },
    {
      title: "Cleaning Fee",
      body: "Please bring indoor non-marking shoes or court shoes to change into before entering the court area. Otherwise a cleaning fee will be charged.",
    },
  ];

  let overlay = null;
  let pendingUrl = null;

  function buildModal() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "announcement-overlay";

    const modal = document.createElement("div");
    modal.className = "announcement-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "disclaimer-title");

    const head = document.createElement("div");
    head.className = "announcement-head";
    const headText = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Before You Book";
    const title = document.createElement("h2");
    title.id = "disclaimer-title";
    title.textContent = "Booking Policies";
    headText.append(eyebrow, title);
    const closeBtn = document.createElement("button");
    closeBtn.className = "announcement-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";
    head.append(headText, closeBtn);

    const body = document.createElement("div");
    body.className = "announcement-body disclaimer-body";
    disclaimerRules.forEach(({ title: ruleTitle, body: ruleBody }, i) => {
      const item = document.createElement("div");
      item.className = i === 0 ? "disclaimer-item disclaimer-item-important" : "disclaimer-item";
      const t = document.createElement("strong");
      t.textContent = ruleTitle;
      const p = document.createElement("p");
      p.textContent = ruleBody;
      item.append(t, p);
      body.appendChild(item);
    });

    const acknowledge = document.createElement("label");
    acknowledge.className = "disclaimer-acknowledge";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "disclaimer-agree";
    const ackText = document.createElement("span");
    ackText.textContent = "I have read and understand the booking policies above.";
    acknowledge.append(checkbox, ackText);

    const actions = document.createElement("div");
    actions.className = "announcement-actions";
    const continueBtn = document.createElement("a");
    continueBtn.className = "button button-disabled";
    continueBtn.target = "_blank";
    continueBtn.rel = "noreferrer";
    continueBtn.textContent = "Continue to Booking";
    continueBtn.setAttribute("aria-disabled", "true");
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "button button-secondary";
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    actions.append(continueBtn, cancelBtn);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        continueBtn.classList.remove("button-disabled");
        continueBtn.removeAttribute("aria-disabled");
      } else {
        continueBtn.classList.add("button-disabled");
        continueBtn.setAttribute("aria-disabled", "true");
      }
    });

    continueBtn.addEventListener("click", (e) => {
      if (continueBtn.classList.contains("button-disabled")) e.preventDefault();
    });

    modal.append(head, body, acknowledge, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove("is-open");

    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    continueBtn.addEventListener("click", close);

    overlay._continueBtn = continueBtn;
  }

  document.querySelectorAll('a[href*="skedda.com"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      pendingUrl = link.href;
      buildModal();
      overlay._continueBtn.href = pendingUrl;
      overlay.classList.add("is-open");
    });
  });
})();

if (!document.querySelector(".page-transition")) {
  const transitionLayer = document.createElement("div");
  transitionLayer.className = "page-transition";
  const transitionLogo = document.createElement("img");
  transitionLogo.src = "../assets/logo-site.png";
  transitionLogo.alt = "Vision Badminton";
  transitionLogo.className = "page-transition-logo";
  transitionLayer.appendChild(transitionLogo);
  document.body.appendChild(transitionLayer);
}

// Site-wide booking system notice — shows once per session
if (!sessionStorage.getItem("booking-notice-dismissed") && !document.querySelector(".announcement-overlay")) {
  const bOverlay = document.createElement("div");
  bOverlay.className = "announcement-overlay";

  const bModal = document.createElement("div");
  bModal.className = "announcement-modal";
  bModal.setAttribute("role", "dialog");
  bModal.setAttribute("aria-modal", "true");
  bModal.setAttribute("aria-labelledby", "booking-notice-title");

  const bHead = document.createElement("div");
  bHead.className = "announcement-head";
  const bHeadText = document.createElement("div");
  const bEyebrow = document.createElement("p");
  bEyebrow.className = "eyebrow";
  bEyebrow.textContent = "New Booking System";
  const bTitle = document.createElement("h2");
  bTitle.id = "booking-notice-title";
  bTitle.textContent = "We've Officially Moved Over!";
  bHeadText.append(bEyebrow, bTitle);
  const bCloseBtn = document.createElement("button");
  bCloseBtn.className = "announcement-close";
  bCloseBtn.type = "button";
  bCloseBtn.setAttribute("aria-label", "Close notice");
  bCloseBtn.textContent = "×";
  bHead.append(bHeadText, bCloseBtn);

  const bBody = document.createElement("div");
  bBody.className = "announcement-body";
  [
    "We have officially moved over to our new booking system. Sign up to book your court.",
  ].forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    bBody.appendChild(p);
  });

  const bActions = document.createElement("div");
  bActions.className = "announcement-actions";
  const bCallBtn = document.createElement("a");
  bCallBtn.className = "button";
  bCallBtn.href = "https://app.courtreserve.com/Online/Portal/Index/18541";
  bCallBtn.target = "_blank";
  bCallBtn.rel = "noreferrer";
  bCallBtn.textContent = "Sign Up Here";
  const bDismissBtn = document.createElement("button");
  bDismissBtn.className = "button button-secondary";
  bDismissBtn.type = "button";
  bDismissBtn.textContent = "Close";
  bActions.append(bCallBtn, bDismissBtn);

  bModal.append(bHead, bBody, bActions);
  bOverlay.appendChild(bModal);
  document.body.appendChild(bOverlay);

  const closeBookingNotice = () => {
    bOverlay.classList.remove("is-open");
    sessionStorage.setItem("booking-notice-dismissed", "1");
  };

  bCloseBtn.addEventListener("click", closeBookingNotice);
  bDismissBtn.addEventListener("click", closeBookingNotice);
  bOverlay.addEventListener("click", (e) => { if (e.target === bOverlay) closeBookingNotice(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBookingNotice(); });

  window.setTimeout(() => {
    bOverlay.classList.add("is-open");
  }, reduceMotion ? 0 : 300);
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

  // Coaches accordion
  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    const trigger = accordion.querySelector(".coaches-accordion-trigger");
    const panel = accordion.querySelector(".coaches-accordion-panel");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", () => {
      const open = accordion.hasAttribute("data-open");
      if (open) {
        accordion.removeAttribute("data-open");
        trigger.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      } else {
        accordion.setAttribute("data-open", "");
        trigger.setAttribute("aria-expanded", "true");
        panel.hidden = false;
      }
    });
  });

  // Pricing tab switcher
  const pricingTabs = document.querySelectorAll("[data-pricing-tab]");
  if (pricingTabs.length) {
    pricingTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.pricingTab;
        pricingTabs.forEach((t) => {
          const active = t.dataset.pricingTab === target;
          t.classList.toggle("pricing-tab-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll("[data-pricing-panel]").forEach((panel) => {
          panel.hidden = panel.dataset.pricingPanel !== target;
        });
      });
    });
  }

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
      }, 480);
    });
  });
}

// Coach carousel: drag to pan, auto-oscillate when idle (transform-based for reliable mobile support)
(function () {
  const track = document.querySelector(".coach-grid.coach-profile-grid");
  const viewport = track && track.closest(".coach-carousel-viewport");
  if (!track || !viewport || reduceMotion) return;

  const IDLE_DELAY = 5000;
  const AUTO_SPEED = 0.05; // px per ms

  let currentX = 0;
  let cachedMax = 0;
  let isDragging = false;
  let pointerId = null;
  let dragStartClientX = 0;
  let dragStartX = 0;
  let pendingX = null;
  let dragRAF = null;
  let idleTimer = null;
  let autoDirection = -1;
  let autoFrame = null;
  let lastFrameTime = null;

  function measureMax() {
    cachedMax = Math.max(0, track.scrollWidth - viewport.clientWidth);
    return cachedMax;
  }

  function applyX(x) {
    currentX = Math.min(0, Math.max(-cachedMax, x));
    track.style.transform = `translateX(${currentX}px)`;
  }

  function stopAuto() {
    if (autoFrame) {
      cancelAnimationFrame(autoFrame);
      autoFrame = null;
    }
    lastFrameTime = null;
  }

  function stepAuto(timestamp) {
    if (lastFrameTime === null) lastFrameTime = timestamp;
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    measureMax();
    if (cachedMax <= 0) {
      autoFrame = null;
      return;
    }

    let next = currentX + autoDirection * AUTO_SPEED * delta;
    if (next <= -cachedMax) {
      next = -cachedMax;
      autoDirection = 1;
    } else if (next >= 0) {
      next = 0;
      autoDirection = -1;
    }
    applyX(next);

    autoFrame = requestAnimationFrame(stepAuto);
  }

  function startAuto() {
    if (autoFrame || isDragging) return;
    lastFrameTime = null;
    autoFrame = requestAnimationFrame(stepAuto);
  }

  function scheduleAuto() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(startAuto, IDLE_DELAY);
  }

  function handleInteractionStart() {
    stopAuto();
    window.clearTimeout(idleTimer);
  }

  function dragTick() {
    dragRAF = null;
    if (pendingX !== null) {
      applyX(pendingX);
      pendingX = null;
    }
    if (isDragging) {
      dragRAF = requestAnimationFrame(dragTick);
    }
  }

  track.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".coach-photo-toggle")) return;
    isDragging = true;
    pointerId = event.pointerId;
    track.setPointerCapture(pointerId);
    track.classList.add("is-dragging");
    dragStartClientX = event.clientX;
    dragStartX = currentX;
    measureMax();
    handleInteractionStart();
    if (!dragRAF) dragRAF = requestAnimationFrame(dragTick);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;
    pendingX = dragStartX + (event.clientX - dragStartClientX);
  });

  function endDrag(event) {
    if (!isDragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    isDragging = false;
    pointerId = null;
    track.classList.remove("is-dragging");
    scheduleAuto();
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  track.addEventListener(
    "wheel",
    () => {
      handleInteractionStart();
      scheduleAuto();
    },
    { passive: true }
  );
  track.addEventListener("coach-carousel-interact", () => {
    handleInteractionStart();
    scheduleAuto();
  });

  window.addEventListener("resize", () => {
    measureMax();
    applyX(currentX);
  });

  measureMax();
  startAuto();
})();

// Coach cards with multiple photos: add prev/next buttons to switch between them
(function () {
  document.querySelectorAll(".coach-photo[data-photos]").forEach((img) => {
    const photos = img.dataset.photos
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (photos.length < 2) return;

    let index = Math.max(0, photos.indexOf(img.getAttribute("src")));

    const wrap = document.createElement("div");
    wrap.className = "coach-photo-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    function makeButton(direction) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `coach-photo-toggle coach-photo-toggle-${direction === -1 ? "prev" : "next"}`;
      btn.setAttribute("aria-label", direction === -1 ? "Show previous photo" : "Show next photo");
      btn.innerHTML =
        direction === -1
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>';
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = (index + direction + photos.length) % photos.length;
        img.src = photos[index];
        const track = wrap.closest(".coach-grid.coach-profile-grid");
        if (track) track.dispatchEvent(new Event("coach-carousel-interact"));
      });
      return btn;
    }

    wrap.appendChild(makeButton(-1));
    wrap.appendChild(makeButton(1));
  });
})();



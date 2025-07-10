// support-faq.js
(function () {
  // Only inject once
  if (window.__supportFAQInjected) return;
  window.__supportFAQInjected = true;

  // Modal HTML
  const faqModal = document.createElement("div");
  faqModal.id = "support-faq-modal";
  // Load HTML from external file
  fetch("/components/support/support.html")
    .then((res) => res.text())
    .then((html) => {
      faqModal.innerHTML = html;
      afterModalHtmlLoaded();
    });
  faqModal.style.display = "none";
  document.body.appendChild(faqModal);

  function afterModalHtmlLoaded() {
    // Import external CSS for modal
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/components/support/support.css";
    document.head.appendChild(link);

    // Show/hide logic
    function showFAQ() {
      faqModal.style.display = "block";
    }
    function hideFAQ() {
      faqModal.style.display = "none";
    }

    // Attach to all .support-btns
    function attachSupportBtnHandler() {
      document.querySelectorAll(".support-btn").forEach((btn) => {
        btn.addEventListener("click", showFAQ);
      });
    }
    attachSupportBtnHandler();

    // Close on backdrop or close button
    faqModal.querySelector(".faq-modal-backdrop").onclick = hideFAQ;
    faqModal.querySelector(".faq-modal-close").onclick = hideFAQ;

    // Tab switching
    const tabBtns = faqModal.querySelectorAll(".faq-tab-btn");
    const tabPanels = faqModal.querySelectorAll(".faq-tab-panel");
    // Ensure the first tab is visible on load
    tabPanels.forEach((panel, idx) => {
      if (idx === 0) {
        panel.style.display = "";
        panel.classList.add("active");
      } else {
        panel.style.display = "none";
        panel.classList.remove("active");
      }
    });
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        tabPanels.forEach((panel) => {
          if (panel.classList.contains("faq-panel-" + this.dataset.tab)) {
            panel.style.display = "";
            panel.classList.add("active");
          } else {
            panel.style.display = "none";
            panel.classList.remove("active");
          }
        });
      });
    });

    // FAQ accordion logic
    faqModal.querySelectorAll(".faq-item").forEach((item) => {
      const question = item.querySelector(".faq-question");
      question.addEventListener("click", function () {
        item.classList.toggle("active");
      });
    });

    // Report form logic
    const reportForm = faqModal.querySelector(".faq-report-form");
    if (reportForm) {
      reportForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const successDiv = reportForm.querySelector(".faq-report-success");
        let errorDiv = reportForm.querySelector(".faq-report-error");
        if (!errorDiv) {
          errorDiv = document.createElement("div");
          errorDiv.className = "faq-report-error";
          errorDiv.style.color = "#dc2626";
          errorDiv.style.marginTop = "0.5em";
          reportForm.insertBefore(errorDiv, successDiv);
        }
        errorDiv.style.display = "none";
        successDiv.style.display = "none";
        // Send to backend
        const formData = new FormData(reportForm);
        const data = Object.fromEntries(formData.entries());
        try {
          const res = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to send report.");
          }
          // Success
          successDiv.textContent = "Message sent!";
          successDiv.style.display = "block";
          errorDiv.style.display = "none";
          if (typeof window.toast !== 'undefined') {
            window.toast.success('Your support request was sent successfully!');
          }
          setTimeout(() => {
            successDiv.style.display = "none";
            reportForm.reset();
          }, 1800);
        } catch (err) {
          errorDiv.textContent = err.message || "Failed to send report.";
          errorDiv.style.display = "block";
          successDiv.style.display = "none";
          if (typeof window.toast !== 'undefined') {
            window.toast.error(err.message || 'Failed to send support request. Please try again.');
          }
        }
      });
    }

    // Optional: close on ESC
    document.addEventListener("keydown", (e) => {
      if (faqModal.style.display === "block" && e.key === "Escape") hideFAQ();
    });

    // In case support-btns are dynamically loaded
    const observer = new MutationObserver(attachSupportBtnHandler);
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();

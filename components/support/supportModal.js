// support-faq.js
(function () {
  // Only inject once
  if (window.__supportFAQInjected) return;
  window.__supportFAQInjected = true;

  // Modal HTML
  const faqModal = document.createElement('div');
  faqModal.id = 'support-faq-modal';
  faqModal.innerHTML = `
    <div class="faq-modal-backdrop"></div>
    <div class="faq-modal-content">
      <button class="faq-modal-close" aria-label="Close">&times;</button>
      <div class="faq-modal-tabs">
        <button class="faq-tab-btn active" data-tab="faq">FAQ</button>
        <button class="faq-tab-btn" data-tab="report">Report</button>
      </div>
      <div class="faq-tab-panel faq-panel-faq">
        <h2 class="faq-modal-title"><i class="fas fa-question-circle"></i> Frequently Asked Questions</h2>
        <div class="faq-accordion">
          <div class="faq-item">
            <button class="faq-question">How do I add a new report?</button>
            <div class="faq-answer">Click the "Add Report" button and fill in the required fields, then submit.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How can I contact support?</button>
            <div class="faq-answer">Use this FAQ or email us at support@minimarket.com.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">Why can't I see my changes?</button>
            <div class="faq-answer">Try refreshing the page or clearing your browser cache.</div>
          </div>
        </div>
      </div>
      <div class="faq-tab-panel faq-panel-report" style="display:none">
        <h2 class="faq-modal-title"><i class="fas fa-paper-plane"></i> Send a Report</h2>
        <form class="faq-report-form">
          <div class="faq-form-group">
            <label for="faq-name">Name</label>
            <input type="text" id="faq-name" name="name" placeholder="John Doe" required />
          </div>
          <div class="faq-form-group">
            <label for="faq-email">Email</label>
            <input type="email" id="faq-email" name="email" placeholder="john.doe@example.com" required />
          </div>
          <div class="faq-form-group">
            <label for="faq-message">Message</label>
            <textarea id="faq-message" name="message" rows="3" required></textarea>
          </div>
          <button type="submit" class="faq-report-submit">Send</button>
          <div class="faq-report-success" style="display:none;color:#16a34a;margin-top:0.5em;">Message sent!</div>
        </form>
      </div>
    </div>
  `;
  faqModal.style.display = 'none';
  document.body.appendChild(faqModal);

  // CSS injection
  const style = document.createElement('style');
  style.textContent = `
    .faq-modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 1001; animation: fadeIn 0.2s;
    }
    .faq-modal-content {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #fff; border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      width: 400px; height: 520px; max-width: 95vw; min-width: 280px;
      padding: 2rem 1.5rem 1.5rem 1.5rem;
      z-index: 1002; animation: popIn 0.25s;
      font-family: inherit;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .faq-modal-tabs {
      display: flex; gap: 0.5em; margin-bottom: 1.2em;
    }
    .faq-tab-btn {
      flex: 1; margin-top:1em; padding: 0.5em 0; border: none; background: #f3f4f6; color: #2563eb; font-weight: 600; border-radius: 0.5em 0.5em 0 0; cursor: pointer; transition: background 0.2s;
    }
    .faq-tab-btn.active {
      background: #2563eb; color: #fff;
    }
    .faq-tab-panel {
      flex: 1 1 auto;
      overflow-y: auto;
      min-height: 0;
    }
    .faq-modal-title {
      font-size: 1.15rem; font-weight: 600; margin-bottom: 1rem; color: #2563eb; display: flex; align-items: center; gap: 0.5em;
    }
    .faq-modal-close {
      position: absolute; top: 0; right: 1.5rem; background: none; border: none; font-size: 2rem; color: #888; cursor: pointer; transition: color 0.2s;
      z-index: 10;
    }
    .faq-modal-content > .faq-modal-close { /* ensure close button is above content */ }
    .faq-accordion { max-height: 320px; overflow-y: auto; }
    .faq-item { border-bottom: 1px solid #e5e7eb; }
    .faq-question {
      width: 100%; text-align: left; background: none; border: none; font-size: 1em; font-weight: 500; color: #374151; padding: 0.8em 0; cursor: pointer; outline: none; transition: color 0.2s;
    }
    .faq-question:after {
      content: '\\25BC'; float: right; font-size: 0.9em; color: #888; transition: transform 0.2s;
    }
    .faq-item.active .faq-question:after {
      transform: rotate(180deg);
    }
    .faq-answer {
      display: none; padding: 0 0 0.8em 0; color: #555; font-size: 0.97em;
    }
    .faq-item.active .faq-answer {
      display: block;
    }
    .faq-panel-report form { display: flex; flex-direction: column; gap: 0.7em; }
    .faq-form-group { display: flex; flex-direction: column; gap: 0.2em; }
    .faq-form-group label { font-size: 0.97em; color: #374151; font-weight: 500; }
    .faq-form-group input, .faq-form-group textarea {
      border: 1px solid #d1d5db; border-radius: 0.5em; padding: 0.5em; font-size: 1em; font-family: inherit; background: #f9fafb;
    }
    .faq-report-submit {
      background: #2563eb; color: #fff; border: none; border-radius: 0.5em; padding: 0.7em 0; font-weight: 600; font-size: 1em; cursor: pointer; margin-top: 0.5em; transition: background 0.2s;
    }
    .faq-report-submit:hover { background: #1d4ed8; }
    @media (max-width: 640px) {
      .faq-modal-content { width: 98vw; max-width: 98vw; padding: 1.2rem 0.7rem 1rem 0.7rem; }
      .faq-modal-title { font-size: 1.1rem; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
  `;
  document.head.appendChild(style);

  // Show/hide logic
  function showFAQ() { faqModal.style.display = 'block'; }
  function hideFAQ() { faqModal.style.display = 'none'; }

  // Attach to all .support-btns
  function attachSupportBtnHandler() {
    document.querySelectorAll('.support-btn').forEach(btn => {
      btn.addEventListener('click', showFAQ);
    });
  }
  attachSupportBtnHandler();

  // Close on backdrop or close button
  faqModal.querySelector('.faq-modal-backdrop').onclick = hideFAQ;
  faqModal.querySelector('.faq-modal-close').onclick = hideFAQ;

  // Tab switching
  const tabBtns = faqModal.querySelectorAll('.faq-tab-btn');
  const tabPanels = faqModal.querySelectorAll('.faq-tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      tabPanels.forEach(panel => {
        panel.style.display = panel.classList.contains('faq-panel-' + this.dataset.tab) ? '' : 'none';
      });
    });
  });

  // FAQ accordion logic
  faqModal.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', function() {
      item.classList.toggle('active');
    });
  });

  // Report form logic
  const reportForm = faqModal.querySelector('.faq-report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Simulate sending message
      reportForm.querySelector('.faq-report-success').style.display = 'block';
      setTimeout(() => {
        reportForm.querySelector('.faq-report-success').style.display = 'none';
        reportForm.reset();
      }, 1800);
    });
  }

  // Optional: close on ESC
  document.addEventListener('keydown', e => {
    if (faqModal.style.display === 'block' && e.key === 'Escape') hideFAQ();
  });

  // In case support-btns are dynamically loaded
  const observer = new MutationObserver(attachSupportBtnHandler);
  observer.observe(document.body, { childList: true, subtree: true });
})();
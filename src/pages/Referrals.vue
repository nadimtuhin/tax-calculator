<template>
  <div class="referrals-page">
    <div class="referrals-container">
      <header class="referrals-hero">
        <span class="hero-eyebrow">Direct Referral Service</span>
        <h1>Connect with an Independent Bangladesh Tax Lawyer</h1>
        <p class="hero-subtitle">
          If your tax situation involves complex income sources, audit scrutiny from the Deputy Commissioner of Taxes, or company-level filing questions, we can connect you with an independent licensed tax lawyer in Bangladesh.
        </p>
      </header>

      <!-- Transparency & Intermediary Disclosure -->
      <section class="disclosure-card" role="region" aria-label="Intermediary disclosure and legal notice">
        <div class="disclosure-header">
          <span class="disclosure-badge">Important Disclosure</span>
          <h2>Referral &amp; Intermediary Service Notice</h2>
        </div>
        <div class="disclosure-body">
          <p>
            <strong>Nadim operates this referral and intermediary service as an individual, not as a law firm.</strong>
            We do not provide legal representation, legal advice, or formal tax opinions. Any legal counsel or formal representation is provided directly and independently by qualified, licensed advocates or tax consultants whom you choose to engage.
          </p>
          <ul class="disclosure-points">
            <li><strong>Manual Review:</strong> Inquiries are personally reviewed by Nadim before any lawyer introduction is made, ensuring your question matches an appropriate legal practitioner.</li>
            <li><strong>No Guaranteed Outcomes:</strong> We make no representations or guarantees regarding legal outcomes, tax savings, or fee arrangements.</li>
            <li><strong>No Vetting or Invented Endorsements:</strong> We connect users with licensed practitioners based on topical relevance. We do not publish artificial testimonials, fictitious case studies, or fixed pricing schedules. Any professional fee is negotiated directly between you and the attorney.</li>
            <li><strong>Monetization Transparency:</strong> This platform may receive a referral fee or nominal consideration from participating practitioners for completed introductions. This does not alter the independence of legal counsel.</li>
          </ul>
        </div>
      </section>

      <!-- Secure Submission Status Banner: Paused / Unavailable -->
      <section class="status-banner" role="status" aria-live="polite">
        <div class="status-indicator">
          <span class="status-dot paused"></span>
          <strong>Direct Submissions Currently Paused</strong>
        </div>
        <p class="status-text">
          In strict accordance with our privacy and data-safety principles, online contact submission is temporarily disabled pending owner verification of an encrypted delivery and spam-protected storage backend.
        </p>
        <p class="status-subtext">
          No personal information or inquiry details will be accepted, transmitted, or logged until secure backend routing is fully authenticated.
        </p>
      </section>

      <!-- Referral Request Concept Form -->
      <section class="form-section" aria-labelledby="form-heading">
        <div class="form-header">
          <h2 id="form-heading">Request an Introduction</h2>
          <p class="form-guidance">
            Review the form below to understand the minimal information needed once online routing resumes.
          </p>
        </div>

        <div class="privacy-warning" role="alert">
          <strong>Privacy Safeguard:</strong> Please do <em>not</em> share Taxpayer Identification Numbers (TIN), National ID (NID) numbers, bank account numbers, confidential payroll slips, or detailed personal balance sheets. We only collect high-level topical context.
        </div>

        <form class="referral-form" @submit.prevent>
          <div class="form-group">
            <label for="ref-name">Full Name <span class="required" aria-hidden="true">*</span></label>
            <input
              id="ref-name"
              type="text"
              class="form-control"
              placeholder="e.g. Rahim Ahmed"
              disabled
              aria-disabled="true"
            />
          </div>

          <div class="form-group">
            <label for="ref-contact">Email Address or Phone Number <span class="required" aria-hidden="true">*</span></label>
            <input
              id="ref-contact"
              type="text"
              class="form-control"
              placeholder="e.g. name@example.com or +880 17..."
              disabled
              aria-disabled="true"
            />
            <span class="field-hint">Used exclusively for introducing you to the practitioner.</span>
          </div>

          <div class="form-group">
            <label for="ref-topic">Topic of Inquiry <span class="required" aria-hidden="true">*</span></label>
            <select id="ref-topic" class="form-control" disabled aria-disabled="true">
              <option value="" selected>Select a relevant legal topic...</option>
              <option value="salary">Salary Income &amp; Employer TDS Discrepancies</option>
              <option value="audit">NBR Audit Scrutiny &amp; DCT Assessment Notices</option>
              <option value="rebate">Section 78 Investment Rebates &amp; Asset Classification</option>
              <option value="foreign">Foreign Remittances &amp; Non-Resident Dual Taxation</option>
              <option value="wealth">Wealth Surcharge &amp; Asset Statement (IT-10B)</option>
              <option value="other">Other Personal Income Tax Matter</option>
            </select>
          </div>

          <div class="form-group">
            <label for="ref-message">Brief Summary of Your Situation <span class="required" aria-hidden="true">*</span></label>
            <textarea
              id="ref-message"
              class="form-control textarea"
              rows="4"
              placeholder="Provide a general 2-3 sentence overview of your question. Do not include financial figures, NID, or TIN numbers."
              disabled
              aria-disabled="true"
            ></textarea>
          </div>

          <div class="consent-group">
            <label class="checkbox-label disabled-label">
              <input type="checkbox" disabled aria-disabled="true" />
              <span>
                I understand that Nadim operates an intermediary referral service (not a law firm), that my request will be reviewed prior to any lawyer introduction, and that no legal advice is being provided through this platform.
              </span>
            </label>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="submit-button"
              disabled
              aria-disabled="true"
              title="Online submission is disabled until secure backend destination is configured"
            >
              Submission Temporarily Unavailable
            </button>
            <span class="action-note">
              No data will be submitted or retained.
            </span>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Referrals'
}
</script>

<style scoped>
.referrals-page {
  background-color: var(--bg);
  min-height: calc(100vh - 64px);
  padding: var(--space-5) var(--space-4) var(--space-6);
}

.referrals-container {
  max-width: 840px;
  margin: 0 auto;
}

.referrals-hero {
  margin-bottom: var(--space-5);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.referrals-hero h1 {
  font-size: clamp(1.75rem, 3.5vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text);
  margin-bottom: var(--space-2);
}

.hero-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  line-height: 1.55;
  max-width: 720px;
}

.disclosure-card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow);
}

.disclosure-header {
  margin-bottom: var(--space-3);
}

.disclosure-badge {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--info);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.disclosure-card h2 {
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--text);
}

.disclosure-body p {
  color: var(--text);
  line-height: 1.6;
  font-size: var(--text-sm);
  margin-bottom: var(--space-3);
}

.disclosure-points {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.disclosure-points strong {
  color: var(--text);
}

.status-banner {
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-left: 5px solid var(--warn);
  border-radius: var(--radius-sm);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  color: var(--warn);
  font-size: var(--text-base);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.paused {
  background-color: var(--warn);
}

.status-text {
  font-size: var(--text-sm);
  color: var(--text);
  line-height: 1.5;
  margin-bottom: var(--space-1);
}

.status-subtext {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

.form-section {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow);
}

.form-header {
  margin-bottom: var(--space-4);
}

.form-header h2 {
  font-size: var(--text-xl);
  font-weight: 650;
  color: var(--text);
  margin-bottom: var(--space-1);
}

.form-guidance {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.privacy-warning {
  background-color: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--text);
  margin-bottom: var(--space-4);
}

.referral-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.required {
  color: var(--bad);
}

.form-control {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--text);
  background-color: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.form-control:disabled {
  background-color: var(--surface-muted);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.85;
}

.form-control.textarea {
  resize: none;
}

.field-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.consent-group {
  margin-top: var(--space-1);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.45;
}

.checkbox-label.disabled-label {
  cursor: not-allowed;
}

.checkbox-label input {
  margin-top: 2px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 var(--space-5);
  font-family: var(--font);
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background-color: var(--surface-muted);
  color: var(--text-muted);
  cursor: not-allowed;
}

.action-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .referrals-container {
    padding: 0;
  }
  
  .disclosure-card,
  .form-section {
    padding: var(--space-4);
  }
}
</style>

// backend/services/emailTemplates.js
// HTML email templates — clean, branded, mobile-friendly

// ── Shared styles used by all templates ───────────────────────────────────
const baseStyle = `
  body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont,
         'Segoe UI', Roboto, sans-serif; background:#f3f4f6; }
  .wrapper { max-width:600px; margin:0 auto; padding:24px 16px; }
  .card { background:#ffffff; border-radius:12px; overflow:hidden;
          box-shadow:0 1px 3px rgba(0,0,0,0.1); }
  .header { background:#166534; padding:28px 32px; text-align:center; }
  .header-icon { font-size:36px; margin-bottom:8px; }
  .header h1 { color:#ffffff; margin:0; font-size:22px; font-weight:600; }
  .header p  { color:#bbf7d0; margin:8px 0 0; font-size:14px; }
  .body { padding:28px 32px; }
  .body p { color:#374151; font-size:15px; line-height:1.6; margin:0 0 16px; }
  .detail-box { background:#f0fdf4; border:1px solid #bbf7d0;
                border-radius:8px; padding:16px 20px; margin:20px 0; }
  .detail-row { display:flex; gap:8px; margin-bottom:10px; font-size:14px; }
  .detail-row:last-child { margin-bottom:0; }
  .detail-label { color:#6b7280; min-width:90px; font-weight:500; }
  .detail-value { color:#111827; flex:1; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:99px;
                  font-size:13px; font-weight:600; }
  .status-pending    { background:#fef9c3; color:#713f12; }
  .status-progress   { background:#dbeafe; color:#1e3a8a; }
  .status-resolved   { background:#dcfce7; color:#166534; }
  .cta-btn { display:block; width:fit-content; margin:24px auto 0;
             background:#16a34a; color:#ffffff; text-decoration:none;
             padding:12px 28px; border-radius:8px; font-weight:600;
             font-size:15px; text-align:center; }
  .footer { padding:20px 32px; border-top:1px solid #f3f4f6; text-align:center; }
  .footer p { color:#9ca3af; font-size:12px; margin:0; line-height:1.6; }
`;

// ── Helper: get badge class from status ───────────────────────────────────
const statusClass = (status) => {
  if (status === 'Pending')     return 'status-pending';
  if (status === 'In Progress') return 'status-progress';
  return 'status-resolved';
};

// ── Template 1: Complaint received confirmation ───────────────────────────
const complaintReceivedTemplate = ({ userName, description, location, complaintId, status }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Complaint Received</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">

          <div class="header">
            <div class="header-icon">🌿</div>
            <h1>Complaint Received</h1>
            <p>We've got your report and are on it!</p>
          </div>

          <div class="body">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>
              Thank you for reporting a garbage issue. Your complaint has been
              successfully submitted and our team has been notified.
            </p>

            <div class="detail-box">
              <div class="detail-row">
                <span class="detail-label">Complaint ID</span>
                <span class="detail-value">#${String(complaintId).slice(-8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${description}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">${location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                  <span class="status-badge ${statusClass(status)}">${status}</span>
                </span>
              </div>
            </div>

            <p>
              You will receive another email when the status of your complaint
              is updated by our team.
            </p>
            <p>
              Together we can keep our community clean! 💚
            </p>
          </div>

          <div class="footer">
            <p>This is an automated message from WasteTracker.</p>
            <p>Please do not reply to this email.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `✅ Complaint Received — #${String(complaintId).slice(-8).toUpperCase()}`,
    html,
  };
};

// ── Template 2: Status updated notification ───────────────────────────────
const statusUpdatedTemplate = ({
  userName, description, location,
  complaintId, oldStatus, newStatus,
  assignedTo, adminNote,
}) => {
  const statusMessages = {
    'Pending':     { emoji: '⏳', msg: 'Your complaint is in the queue.' },
    'In Progress': { emoji: '🔧', msg: 'Our team is working on your complaint right now!' },
    'Resolved':    { emoji: '✅', msg: 'Your complaint has been resolved. Thank you for reporting!' },
  };

  const { emoji, msg } = statusMessages[newStatus] || { emoji: '📋', msg: '' };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Complaint Status Updated</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">

          <div class="header">
            <div class="header-icon">${emoji}</div>
            <h1>Status Updated</h1>
            <p>Your complaint status has changed</p>
          </div>

          <div class="body">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>${msg}</p>

            <div class="detail-box">
              <div class="detail-row">
                <span class="detail-label">Complaint ID</span>
                <span class="detail-value">#${String(complaintId).slice(-8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${description}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">${location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Previous</span>
                <span class="detail-value">
                  <span class="status-badge ${statusClass(oldStatus)}">${oldStatus}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">New Status</span>
                <span class="detail-value">
                  <span class="status-badge ${statusClass(newStatus)}">${newStatus}</span>
                </span>
              </div>
              ${assignedTo ? `
              <div class="detail-row">
                <span class="detail-label">Assigned To</span>
                <span class="detail-value">${assignedTo}</span>
              </div>` : ''}
              ${adminNote ? `
              <div class="detail-row">
                <span class="detail-label">Admin Note</span>
                <span class="detail-value" style="color:#1d4ed8;font-style:italic">
                  "${adminNote}"
                </span>
              </div>` : ''}
            </div>

            ${newStatus === 'Resolved' ? `
            <p>
              We hope your issue was resolved to your satisfaction.
              If the problem persists, please submit a new complaint.
            </p>` : `
            <p>
              We will keep you updated as the situation progresses.
            </p>`}
          </div>

          <div class="footer">
            <p>This is an automated message from WasteTracker.</p>
            <p>Please do not reply to this email.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `${emoji} Complaint ${newStatus} — #${String(complaintId).slice(-8).toUpperCase()}`,
    html,
  };
};

module.exports = {
  complaintReceivedTemplate,
  statusUpdatedTemplate,
};
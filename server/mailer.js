import nodemailer from 'nodemailer';

/**
 * Returns a configured Nodemailer transporter using Gmail SMTP.
 * Strips whitespace from Google App Passwords for resilience.
 */
export function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // Handles spaces in copied 16-char app passwords
    }
  });
}

/**
 * Verifies if Gmail credentials are valid.
 */
export async function testGmailConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'GMAIL_USER or GMAIL_APP_PASSWORD is not configured in .env'
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      message: `Gmail SMTP connected successfully using ${process.env.GMAIL_USER}`
    };
  } catch (error) {
    console.error('❌ [Mailer] Gmail verification failed:', error.message);
    return {
      configured: false,
      error: error.message
    };
  }
}

/**
 * Dispatches email notifications when a client requests a PRO upgrade:
 * 1. An alert email to the Admin Gmail with client and payment details.
 * 2. A confirmation receipt email to the client.
 */
export async function sendProUpgradeNotification({
  name,
  email,
  plan = 'pro',
  price = '$1/mo',
  payment_method = 'Standard Inquiry',
  message = '',
  requestId = ''
}) {
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'admin@gmail.com';
  const senderUser = process.env.GMAIL_USER;

  if (!transporter || !senderUser) {
    console.warn('⚠️ [Mailer] Gmail credentials (GMAIL_USER / GMAIL_APP_PASSWORD) not configured. Email skipped.');
    return {
      success: false,
      reason: 'credentials_missing',
      adminEmail
    };
  }

  const results = { adminSent: false, clientSent: false };
  const requestedTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Phnom_Penh'
  });

  // 1. Email to Admin Gmail
  try {
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 28px 24px; }
          .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 9999px; font-weight: 600; font-size: 12px; text-transform: uppercase; margin-bottom: 16px; }
          .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; text-align: right; }
          .note-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #92400e; margin-bottom: 24px; }
          .cta-btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 10px; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New PRO Upgrade Request</h1>
            <p>A client has requested an upgrade to the PRO plan.</p>
          </div>
          <div class="content">
            <span class="badge">Pending Admin Approval</span>
            
            <div class="detail-box">
              <div class="detail-row">
                <span class="label">Client Name</span>
                <span class="value">${name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Client Email</span>
                <span class="value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></span>
              </div>
              <div class="detail-row">
                <span class="label">Plan</span>
                <span class="value" style="color: #7c3aed; text-transform: uppercase;">${plan}</span>
              </div>
              <div class="detail-row">
                <span class="label">Price / Period</span>
                <span class="value">${price}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Method</span>
                <span class="value">${payment_method}</span>
              </div>
              <div class="detail-row">
                <span class="label">Request ID</span>
                <span class="value" style="font-family: monospace; font-size: 12px;">${requestId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date &amp; Time</span>
                <span class="value">${requestedTime}</span>
              </div>
            </div>

            ${message ? `
              <div class="note-box">
                <strong>Client Message:</strong>
                <p style="margin: 6px 0 0;">"${message}"</p>
              </div>
            ` : ''}

            <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
              Please log in to your <strong>Admin Dashboard &gt; User Management</strong> to verify the payment and approve this upgrade.
            </p>

            <a href="http://localhost:5173/admin/users" class="cta-btn">Open Admin Dashboard</a>
          </div>
          <div class="footer">
            Pro Expense Tracker &bull; Automated System Notification
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: adminEmail,
      subject: `🔥 [PRO Request] ${name} requested an upgrade to PRO (${price})`,
      html: adminHtml,
      text: `New PRO Upgrade Request:\nClient: ${name} (${email})\nPlan: ${plan} (${price})\nPayment: ${payment_method}\nMessage: ${message || 'None'}\nRequest ID: ${requestId}`
    });

    console.log(`✅ [Mailer] Admin alert sent to ${adminEmail} for client ${email}`);
    results.adminSent = true;
  } catch (err) {
    console.error(`❌ [Mailer] Failed to send admin alert to ${adminEmail}:`, err.message);
    results.adminError = err.message;
  }

  // 2. Confirmation Receipt Email to Client
  try {
    const clientHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 32px 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { padding: 28px 24px; font-size: 15px; line-height: 1.6; color: #334155; }
          .summary-card { background: #f1f5f9; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Upgrade Request Received!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for choosing <strong>Pro Expense Tracker</strong>! We have received your request to upgrade to the <strong>PRO Plan</strong>.</p>
            
            <div class="summary-card">
              <div class="summary-row">
                <span>Plan:</span>
                <strong>PRO (${price})</strong>
              </div>
              <div class="summary-row">
                <span>Payment Method:</span>
                <strong>${payment_method}</strong>
              </div>
              <div class="summary-row">
                <span>Request ID:</span>
                <span style="font-family: monospace;">${requestId}</span>
              </div>
            </div>

            <p>Our administrator is reviewing your payment. As soon as verification is complete, all PRO features (tax deduction tracking, unlimited AI scans, and advanced reports) will be unlocked automatically on your account.</p>
            <p>If you have any questions, feel free to reply directly to this email.</p>
          </div>
          <div class="footer">
            Pro Expense Tracker Team &bull; Phnom Penh, Cambodia
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: email,
      subject: `✨ We received your PRO Upgrade request - Pro Expense Tracker`,
      html: clientHtml,
      text: `Hi ${name},\n\nWe received your PRO Upgrade request for ${plan} (${price}). Our administrator is verifying your payment and will activate your PRO tier shortly!\n\nRequest ID: ${requestId}`
    });

    console.log(`✅ [Mailer] Confirmation receipt sent to client ${email}`);
    results.clientSent = true;
  } catch (err) {
    console.error(`❌ [Mailer] Failed to send client confirmation to ${email}:`, err.message);
    results.clientError = err.message;
  }

  return {
    success: results.adminSent,
    results,
    adminEmail
  };
}

/**
 * Dispatches an email to the client when Admin approves their PRO upgrade.
 */
export async function sendProApprovedNotification({ name, email }) {
  const transporter = getTransporter();
  const senderUser = process.env.GMAIL_USER;

  if (!transporter || !senderUser) return;

  try {
    const approvedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 28px 24px; font-size: 15px; line-height: 1.6; color: #334155; }
          .feature-list { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #166534; }
          .feature-list li { margin: 8px 0; }
          .cta-btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your PRO Plan is Now Active!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Great news! Your payment has been verified and your account has been upgraded to <strong>PRO Tier</strong>.</p>
            
            <div class="feature-list">
              <strong>Unlocked Features:</strong>
              <ul style="padding-left: 20px; margin: 10px 0 0;">
                <li>Unlimited AI Smart Receipt Scans</li>
                <li>Comprehensive Tax Deduction &amp; PDF Report Exports</li>
                <li>Advanced Visual Analytics &amp; Multi-Currency Conversion</li>
                <li>Priority Cloud Support</li>
              </ul>
            </div>

            <a href="http://localhost:5173/dashboard" class="cta-btn">Start Using PRO Features</a>
          </div>
          <div class="footer">
            Pro Expense Tracker Team &bull; Enjoy your financial clarity!
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: email,
      subject: `🎉 Congratulations! Your PRO Plan is Activated - Pro Expense Tracker`,
      html: approvedHtml,
      text: `Hi ${name},\n\nYour account has been successfully upgraded to PRO! All premium features, tax deductions, and unlimited AI scans are now active.\n\nEnjoy tracking!`
    });

    console.log(`✅ [Mailer] PRO activation email delivered to ${email}`);
  } catch (err) {
    console.error(`❌ [Mailer] Failed to send activation email to ${email}:`, err.message);
  }
}

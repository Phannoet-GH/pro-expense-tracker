import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnv = path.resolve(__dirname, '../.env');

// Ensure .env is loaded from project root
dotenv.config({ path: rootEnv });
dotenv.config();

export function reloadEnv() {
  dotenv.config({ path: rootEnv, override: true });
  dotenv.config({ override: true });
}

/**
 * Dispatches an email via Resend HTTPS API (Port 443 - works everywhere, immune to cloud SMTP blocks).
 */
export async function sendViaResend({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const payload = {
    from: process.env.RESEND_FROM || 'SmartFinance PRO <onboarding@resend.dev>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text
  };

  if (replyTo) {
    payload.reply_to = Array.isArray(replyTo) ? replyTo : [replyTo];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Resend API error (${res.status})`);
  }
  return data;
}

/**
 * Returns a configured Nodemailer transporter using Gmail SMTP.
 * Defaults to port 587 (STARTTLS) which is widely supported across cloud providers,
 * with support for port 465 (SSL).
 * Strips whitespace from Google App Passwords for resilience.
 */
export function getTransporter(customPort) {
  reloadEnv();
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  const port = parseInt(customPort || process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // Handles spaces in copied 16-char app passwords
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Verifies if email service is active (supports Resend HTTPS API and Gmail SMTP).
 */
export async function testGmailConnection() {
  reloadEnv();
  const resendKey = process.env.RESEND_API_KEY;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || user || 'petphannoet@gmail.com';

  // 1. If Resend API Key is set, test Resend HTTPS (works 100% on Railway/Render)
  if (resendKey) {
    try {
      await sendViaResend({
        to: adminEmail,
        subject: `🧪 [Test Email] SmartFinance PRO Email System is Connected (via Resend)!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 550px; margin: 0 auto;">
            <h2 style="color: #2563eb; margin-top: 0;">✅ Cloud Email Service Connected!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">This email was sent via Resend HTTPS API (Port 443). Your cloud server is fully capable of sending notifications!</p>
            <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Provider:</strong> Resend Cloud HTTPS API</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient:</strong> ${adminEmail}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">You will receive live PRO upgrade notifications here.</p>
          </div>
        `,
        text: `SmartFinance PRO: Cloud email test delivered successfully to ${adminEmail} via Resend at ${new Date().toLocaleString()}`
      });

      return {
        configured: true,
        provider: 'Resend',
        message: `Live test email sent successfully via Resend API to ${adminEmail}! Please check your inbox (and Spam folder).`
      };
    } catch (err) {
      return {
        configured: false,
        error: `Resend API Error: ${err.message}. Please check your RESEND_API_KEY in cloud variables.`
      };
    }
  }

  // 2. Otherwise test Gmail SMTP
  if (!user || !pass) {
    return {
      configured: false,
      message: 'No email credentials found. Set RESEND_API_KEY (recommended for cloud) or GMAIL_USER & GMAIL_APP_PASSWORD.'
    };
  }

  // Try port 587 (STARTTLS) first
  let primaryErr = null;
  try {
    const t587 = getTransporter(587);
    await t587.verify();

    await t587.sendMail({
      from: `"Pro Expense Tracker" <${user}>`,
      to: adminEmail,
      subject: `🧪 [Test Email] SmartFinance PRO Email System is Connected!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 550px; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-top: 0;">✅ Gmail SMTP Test Successful!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">This email confirms that your Gmail configuration is working and able to deliver emails.</p>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Sender:</strong> ${user}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient:</strong> ${adminEmail}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Port:</strong> 587 (STARTTLS)</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `SmartFinance PRO: Gmail SMTP test email delivered successfully to ${adminEmail} at ${new Date().toLocaleString()}`
    });

    return {
      configured: true,
      port: 587,
      message: `Test email sent successfully to ${adminEmail}! Please check your inbox (and Spam folder).`
    };
  } catch (err587) {
    primaryErr = err587;
    console.warn('⚠️ [Mailer] Port 587 check failed, attempting port 465 fallback...', err587.message);
  }

  // Fallback to port 465 (SSL)
  try {
    const t465 = getTransporter(465);
    await t465.verify();

    await t465.sendMail({
      from: `"Pro Expense Tracker" <${user}>`,
      to: adminEmail,
      subject: `🧪 [Test Email] SmartFinance PRO Email System is Connected!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 550px; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-top: 0;">✅ Gmail SMTP Test Successful!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">This email confirms that your Gmail configuration is working and able to deliver emails.</p>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Sender:</strong> ${user}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient:</strong> ${adminEmail}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Port:</strong> 465 (SSL)</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `SmartFinance PRO: Gmail SMTP test email delivered successfully to ${adminEmail} at ${new Date().toLocaleString()}`
    });

    return {
      configured: true,
      port: 465,
      message: `Test email sent successfully to ${adminEmail}! Please check your inbox (and Spam folder).`
    };
  } catch (err465) {
    console.error('❌ [Mailer] Both port 587 and 465 failed:', err465.message);

    const isBadCredentials =
      primaryErr?.message?.includes('535') ||
      err465?.message?.includes('535') ||
      primaryErr?.message?.includes('BadCredentials') ||
      err465?.message?.includes('BadCredentials');

    const isTimeout =
      primaryErr?.message?.toLowerCase().includes('timeout') ||
      err465?.message?.toLowerCase().includes('timeout') ||
      primaryErr?.code === 'ETIMEDOUT' ||
      err465?.code === 'ETIMEDOUT';

    let errorDetail = err465.message;
    if (isBadCredentials) {
      errorDetail = 'Invalid Gmail App Password. Make sure 2-Step Verification is ON and create a 16-character App Password at https://myaccount.google.com/apppasswords.';
    } else if (isTimeout) {
      errorDetail = 'Railway blocks outbound SMTP ports (587 & 465). To send emails reliably on Railway, get a free API key at https://resend.com (free, takes 30s) and add RESEND_API_KEY to your Railway Variables.';
    }

    return {
      configured: false,
      error: errorDetail
    };
  }
}

/**
 * Sends mail with priority to HTTPS API (Resend) if configured,
 * otherwise falls back to Gmail SMTP (ports 587 / 465).
 */
async function sendMailWithFallback(mailOptions) {
  reloadEnv();

  // 1. If RESEND_API_KEY is configured, use fast HTTPS API (never blocked by Railway/Render!)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('🚀 [Mailer] Sending via Resend HTTPS API...');
      return await sendViaResend({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text
      });
    } catch (resendErr) {
      console.error('❌ [Mailer] Resend API failed:', resendErr.message);
      // Fall through to SMTP if available
    }
  }

  // 2. Try Gmail SMTP port 587
  let primaryError = null;
  try {
    const t587 = getTransporter(587);
    if (t587) return await t587.sendMail(mailOptions);
  } catch (err587) {
    primaryError = err587;
    console.warn('⚠️ [Mailer] sendMail on port 587 failed, trying port 465 fallback...', err587.message);
  }

  // 3. Fallback to Gmail SMTP port 465
  const t465 = getTransporter(465);
  if (t465) return await t465.sendMail(mailOptions);
  if (primaryError) throw primaryError;
}

export async function sendProUpgradeNotification({
  name,
  email,
  plan = 'pro',
  price = '$1/mo',
  payment_method = 'Standard Inquiry',
  message = '',
  requestId = ''
}) {
  reloadEnv();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'admin@gmail.com';
  const senderUser = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!senderUser || !pass) {
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

            <!-- Client Message & Direct Reply Section -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <div style="font-weight: 700; color: #166534; font-size: 14px; margin-bottom: 8px;">
                💬 Message from Client (${name}):
              </div>
              <div style="background: #ffffff; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; font-size: 15px; color: #1e293b; font-style: italic; line-height: 1.5; margin-bottom: 14px;">
                "${message ? message : '(No custom note attached — standard upgrade request)'}"
              </div>
              <p style="margin: 0 0 12px; font-size: 13px; color: #374151;">
                💡 <strong>Reply to Client:</strong> You can hit <strong>Reply</strong> in your Gmail to send an email straight to <strong>${email}</strong>, or click the button below:
              </p>
              <a href="mailto:${email}?subject=Re:%20SmartFinance%20PRO%20Upgrade%20Inquiry%20(${encodeURIComponent(plan.toUpperCase())})&body=Hi%20${encodeURIComponent(name)},%0D%0A%0D%0AThank%20you%20for%20your%20message%20regarding%20the%20PRO%20plan!%0D%0A%0D%0A" style="display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                ✉️ Click to Reply to ${name} (${email})
              </a>
            </div>

            <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
              When payment is verified, click below to open your <strong>Admin Dashboard &gt; User Management</strong> to approve this upgrade:
            </p>

            <a href="http://localhost:5173/admin/users" class="cta-btn">Open Admin Dashboard &amp; Approve PRO</a>
          </div>
          <div class="footer">
            Pro Expense Tracker &bull; Automated System Notification
          </div>
        </div>
      </body>
      </html>
    `;

    await sendMailWithFallback({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: adminEmail,
      replyTo: `${name} <${email}>`,
      subject: `🔥 [PRO Request] ${name} (${email}) requested PRO (${price})`,
      html: adminHtml,
      text: `New PRO Upgrade Request:\nClient: ${name} (${email})\nPlan: ${plan} (${price})\nPayment: ${payment_method}\nMessage: ${message || 'None'}\nRequest ID: ${requestId}\n\nTo reply directly to ${name}, hit Reply in your email app or write to: ${email}`
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
            <p>Thank you for requesting an upgrade to <strong>SmartFinance PRO</strong>! We have received your inquiry and our administrator will review your payment details shortly.</p>

            <div class="summary-card">
              <div class="summary-row">
                <span>Requested Plan:</span>
                <strong>SmartFinance PRO (${price})</strong>
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
            <p>If you have any questions or need to follow up, feel free to reply directly to this email.</p>
          </div>
          <div class="footer">
            Pro Expense Tracker Team &bull; Phnom Penh, Cambodia
          </div>
        </div>
      </body>
      </html>
    `;

    await sendMailWithFallback({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: email,
      replyTo: adminEmail,
      subject: `✨ We received your PRO Upgrade request - Pro Expense Tracker`,
      html: clientHtml,
      text: `Hi ${name},\n\nWe received your PRO Upgrade request for ${plan} (${price}). Our administrator (${adminEmail}) is verifying your payment and will activate your PRO tier shortly!\n\nRequest ID: ${requestId}\nIf you have any questions, feel free to reply directly to this email.`
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
  reloadEnv();
  const senderUser = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!senderUser || !pass) return;

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

    const adminEmail = process.env.ADMIN_EMAIL || senderUser || 'admin@gmail.com';
    await sendMailWithFallback({
      from: `"Pro Expense Tracker" <${senderUser}>`,
      to: email,
      replyTo: adminEmail,
      subject: `🎉 Congratulations! Your PRO Plan is Activated - Pro Expense Tracker`,
      html: approvedHtml,
      text: `Hi ${name},\n\nYour account has been successfully upgraded to PRO! All premium features, tax deductions, and unlimited AI scans are now active.\n\nEnjoy tracking!`
    });

    console.log(`✅ [Mailer] PRO activation email delivered to ${email}`);
  } catch (err) {
    console.error(`❌ [Mailer] Failed to send activation email to ${email}:`, err.message);
  }
}

/**
 * Sends a direct message/reply from Admin (petphannoet@gmail.com) to the client.
 */
export async function sendAdminReplyToClient({
  clientName,
  clientEmail,
  replyMessage,
  subject,
  plan = 'pro',
  price = '$1/mo',
  requestId = ''
}) {
  reloadEnv();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'petphannoet@gmail.com';
  const senderUser = process.env.GMAIL_USER || 'petphannoet@gmail.com';

  const replyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 28px 24px; font-size: 15px; line-height: 1.6; color: #334155; }
        .message-box { background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 18px 20px; margin: 20px 0; color: #1e293b; font-size: 15px; white-space: pre-wrap; line-height: 1.6; font-style: normal; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        .cta-btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Message from Administrator</h1>
          <p>SmartFinance PRO &bull; Support &amp; Verification</p>
        </div>
        <div class="content">
          <p>Hi <strong>${clientName}</strong>,</p>
          <p>You have received a reply from <strong>${adminEmail}</strong> regarding your <strong>SmartFinance PRO (${price})</strong> inquiry:</p>

          <div class="message-box">${replyMessage}</div>

          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
            💡 <strong>Need to reply?</strong> You can hit <strong>Reply</strong> in your email app to respond directly to ${adminEmail}.
          </p>

          <a href="http://localhost:5173/dashboard" class="cta-btn">Open SmartFinance Portal</a>
        </div>
        <div class="footer">
          SmartFinance PRO &bull; Direct Support from ${adminEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendMailWithFallback({
    from: `"Pet Phannoet (SmartFinance)" <${senderUser}>`,
    to: clientEmail,
    replyTo: adminEmail,
    subject: subject || `💬 [Reply from Pet Phannoet] Regarding your SmartFinance PRO Inquiry`,
    html: replyHtml,
    text: `Hi ${clientName},\n\nYou have received a reply from ${adminEmail} regarding your PRO upgrade inquiry:\n\n${replyMessage}\n\nTo reply, simply reply directly to this email (${adminEmail}).`
  });
}


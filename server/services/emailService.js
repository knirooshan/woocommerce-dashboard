const nodemailer = require("nodemailer");
const Settings = require("../models/Settings"); // Tenant Settings Schema
const { getCentralConnection } = require("./connectionManager");
const SystemSettingsSchema = require("../models/central/SystemSettings"); // System Settings Schema

let cachedTransporter = null;
let cachedConfigKey = null;

const createTransporter = (smtp) => {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

// Generic email sender (uses provided SMTP config)
const sendEmailWithConfig = async (
  smtpConfig,
  to,
  subject,
  text,
  html,
  attachments = []
) => {
  const configKey = `${smtpConfig.host}|${smtpConfig.port}|${smtpConfig.user}|${smtpConfig.secure}`;

  if (!cachedTransporter || cachedConfigKey !== configKey) {
    cachedTransporter = createTransporter(smtpConfig);
    cachedConfigKey = configKey;
  }

  const mailOptions = {
    from: `"${smtpConfig.fromName || smtpConfig.user}" <${smtpConfig.user}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  return cachedTransporter.sendMail(mailOptions);
};

// 1. Internal Transport Function (Actually sends the email)
// This is now called by the Queue Processor, not directly by the app.
const transportSystemEmail = async (
  to,
  subject,
  text,
  html,
  attachments = []
) => {
  try {
    const conn = getCentralConnection();

    const SystemSettings =
      conn.models.SystemSettings ||
      conn.model("SystemSettings", SystemSettingsSchema);

    const settings = await SystemSettings.findOne();

    if (!settings) {
      throw new Error("SystemSettings document not found in DB.");
    }

    if (!settings.smtp || !settings.smtp.host) {
      throw new Error("System SMTP settings not configured.");
    }

    const info = await sendEmailWithConfig(
      {
        ...settings.smtp,
        fromName: settings.smtp.fromName || "MerchPilot Admin",
      },
      to,
      subject,
      text,
      html,
      attachments
    );
    return info;
  } catch (error) {
    console.error("Error transporting system email:", error);
    throw error;
  }
};

// 2. Public Queue Function (Enqueues the email)
const sendSystemEmail = async (to, subject, text, html, attachments = []) => {
  try {
    const conn = getCentralConnection();
    const EmailQueueSchema = require("../models/central/EmailQueue");
    const EmailQueue =
      conn.models.EmailQueue || conn.model("EmailQueue", EmailQueueSchema);

    await EmailQueue.create({
      to,
      subject,
      text,
      html,
      attachments,
    });

    return { message: "Email queued" };
  } catch (error) {
    console.error("Failed to queue email:", error);
    throw error;
  }
};

// Wrapper for processor to call
const transportGenericEmail = async (
  smtpConfig,
  to,
  subject,
  text,
  html,
  attachments
) => {
  return sendEmailWithConfig(smtpConfig, to, subject, text, html, attachments);
};

// 2. Tenant Emails (Uses Tenant DB -> Settings) - Enqueues email with Tenant SMTP config
const sendEmail = async (
  smtpConfig,
  to,
  subject,
  text,
  html,
  attachments = []
) => {
  try {
    // Enqueue with the provided SMTP config
    const conn = getCentralConnection();
    const EmailQueueSchema = require("../models/central/EmailQueue");
    const EmailQueue =
      conn.models.EmailQueue || conn.model("EmailQueue", EmailQueueSchema);

    await EmailQueue.create({
      to,
      subject,
      text,
      html,
      attachments,
      smtpConfig, // Save tenant specific config
    });

    return { message: "Email queued" };
  } catch (error) {
    console.error("Failed to queue tenant email:", error);
    throw error;
  }
};

const sendTenantWelcomeEmail = async (to, tenantName, subdomain, passkey) => {
  const subject = "Welcome to MerchPilot - Complete Your Setup";
  const loginUrl = `http://${subdomain}.merchpilot.xyz:5173`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="cid:merchpilot-logo" alt="MerchPilot Logo" style="max-height: 40px; max-width: 40px;" />
        <h1 style="color: #0f172a; margin: 0; font-size: 24px;">MerchPilot</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${tenantName}!</h2>
        <p style="color: #475569; line-height: 1.5;">
          Your organization account has been created successfully. To get started, please complete your initial setup using the details below.
        </p>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: bold;">
            Your Setup Passkey
          </p>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">
            ${passkey}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Complete Setup Here
          </a>
        </div>
        <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 10px;">
           Or visit: <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
        </p>

        <p style="color: #475569; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          If you have any questions, please contact the MerchPilot support team.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} MerchPilot. All rights reserved.
      </div>
    </div>
  `;

  // Attach logo from public directory (assuming path is resolved correctly relative to server process)
  // We need to require path module if not present, but for now we'll assume absolute path or relative from CWD
  // Better use absolute path.
  const path = require("path");
  const logoPath = path.join(process.cwd(), "../client/public/merchpilot.png");

  return sendSystemEmail(
    to,
    subject,
    `Welcome! Your passkey is ${passkey}. Setup: ${loginUrl}`,
    html,
    [
      {
        filename: "merchpilot.png",
        path: logoPath,
        cid: "merchpilot-logo",
      },
    ]
  );
};

const sendPasskeyResetEmail = async (to, tenantName, subdomain, passkey) => {
  const subject = "MerchPilot - Your Setup Passkey Has Changed";
  const loginUrl = `http://${subdomain}.merchpilot.xyz:5173`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="cid:merchpilot-logo" alt="MerchPilot Logo" style="max-height: 40px; max-width: 40px;" />
        <h1 style="color: #0f172a; margin: 0; font-size: 24px;">MerchPilot</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #0f172a; margin-top: 0;">Passkey Regenerated</h2>
        <p style="color: #475569; line-height: 1.5;">
          Hello ${tenantName},<br/><br/>
          Your setup passkey has been regenerated by an administrator. Please use the new details below to access your account.
        </p>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: bold;">
            New Setup Passkey
          </p>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">
            ${passkey}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Access Setup Page
          </a>
        </div>
        <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 10px;">
           Or visit: <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
        </p>

        <p style="color: #475569; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          If you currently have access, you can ignore this, but you may need it for recovery. If you did not request this, please contact support immediately.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} MerchPilot. All rights reserved.
      </div>
    </div>
  `;

  // Attach logo
  const path = require("path");
  const logoPath = path.join(process.cwd(), "../client/public/merchpilot.png");

  return sendSystemEmail(
    to,
    subject,
    `Your new passkey is ${passkey}. Setup: ${loginUrl}`,
    html,
    [
      {
        filename: "merchpilot.png",
        path: logoPath,
        cid: "merchpilot-logo",
      },
    ]
  );
};

module.exports = {
  sendEmail,
  sendTenantWelcomeEmail,
  sendPasskeyResetEmail,
  transportSystemEmail,
  transportGenericEmail,
};

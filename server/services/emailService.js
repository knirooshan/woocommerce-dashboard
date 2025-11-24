const nodemailer = require("nodemailer");
const Settings = require("../models/Settings");

let cachedTransporter = null;
let cachedConfigKey = null;

const createTransporterFromSettings = (settings) => {
  // createTransport options; enable pooling to avoid reconnect overhead
  return nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure, // true for 465, false for other ports
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

const sendEmail = async (to, subject, text, html, attachments = []) => {
  try {
    const settings = await Settings.findOne();

    if (!settings || !settings.smtp || !settings.smtp.host) {
      throw new Error("SMTP settings not configured");
    }

    const configKey = `${settings.smtp.host}|${settings.smtp.port}|${settings.smtp.user}|${settings.smtp.secure}`;

    if (!cachedTransporter || cachedConfigKey !== configKey) {
      cachedTransporter = createTransporterFromSettings(settings);
      cachedConfigKey = configKey;
    }

    const mailOptions = {
      from: `"${settings.storeName}" <${settings.smtp.user}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await cachedTransporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };

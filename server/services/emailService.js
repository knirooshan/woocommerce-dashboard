const nodemailer = require("nodemailer");
const Settings = require("../models/Settings");

const sendEmail = async (to, subject, text, html, attachments = []) => {
  try {
    const settings = await Settings.findOne();

    if (!settings || !settings.smtp || !settings.smtp.host) {
      throw new Error("SMTP settings not configured");
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp.host,
      port: settings.smtp.port,
      secure: settings.smtp.secure, // true for 465, false for other ports
      auth: {
        user: settings.smtp.user,
        pass: settings.smtp.pass,
      },
    });

    const mailOptions = {
      from: `"${settings.storeName}" <${settings.smtp.user}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };

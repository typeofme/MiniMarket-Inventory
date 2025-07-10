// controllers/supportController.js
const SupportRequest = require("../models/SupportRequest");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_TO = "dekhsafnan@gmail.com";

exports.submitSupportRequest = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    // Save to DB
    await SupportRequest.create({ name, email, message });

    // Send email via Resend
    try {
      await resend.emails.send({
        from: "MiniMarket Support <onboarding@resend.dev>",
        to: EMAIL_TO,
        subject: `MiniMarket Support Request from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return res.status(500).json({
        success: false,
        message: "Support request saved, but failed to send email.",
        emailError: emailErr.message || emailErr.toString(),
      });
    }

    res.json({
      success: true,
      message: "Support request submitted and email sent.",
    });
  } catch (err) {
    console.error("Support request error:", err);
    res.status(500).json({ error: "Failed to submit support request." });
  }
};

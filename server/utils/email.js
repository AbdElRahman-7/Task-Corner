const sendEmail = async (options) => {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    console.warn("---------------------------------------------------------");
    console.warn("CRITICAL: nodemailer is NOT installed.");
    console.warn("Please run: npm install nodemailer (inside /server)");
    console.warn("---------------------------------------------------------");
    return;
  }

  let transporter;

  // Use real credentials if available, otherwise create a test account
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 465,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // AUTOMATIC TEST ACCOUNT (Perfect for dev)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Using Ethereal test account for this email.");
  }

  const mailOptions = {
    from: `"TaskCorner" <${process.env.EMAIL_USER || 'invites@taskcorner.app'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("---------------------------------------------------------");
    console.log("Email sent successfully!");
    console.log("Recipient:", options.email);
    
    // If using Ethereal, provide a preview URL
    if (!process.env.EMAIL_USER) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      console.log("Click the link above to see exactly what the user received!");
    }
    console.log("---------------------------------------------------------");
  } catch (err) {
    console.error("---------------------------------------------------------");
    console.error("EMAIL ERROR:", err.message);
    console.error("Make sure your SMTP settings in .env are correct.");
    console.error("---------------------------------------------------------");
  }
};

module.exports = sendEmail;

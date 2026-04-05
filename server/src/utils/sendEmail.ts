import nodemailer from "nodemailer";

const sendEmail = async (mailOptions:any, callback:any) => {
  console.log("Sending email with these credentials:")
  console.log("Email: ", mailOptions)
  console.log("Email sender: ", process.env.EMAIL_SENDER)
  console.log("Email service: ", process.env.EMAIL_SERVICE)
  console.log("Email host: ", process.env.EMAIL_HOST)
  console.log("Email port: ", process.env.EMAIL_PORT)
  let config:any = {
      port: Number(process.env.EMAIL_PORT),
      host: process.env.EMAIL_HOST
    /*
    # The commented out fields aren't required for Mailhog
    service: process.env.SERVICE,
    secure: Boolean(process.env.SECURE),
    */
  }
  if (process.env.NODE_ENV == "production") {
    config.service = process.env.EMAIL_SERVICE || undefined
    config.auth = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
    config.tls = {
      rejectUnauthorized: false
    }
  } 
  const transporter = nodemailer.createTransport(config);
  console.log("Sending email!")
  await transporter.sendMail(mailOptions, callback);
  return true
};

export default sendEmail;
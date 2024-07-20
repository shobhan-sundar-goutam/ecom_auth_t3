import nodemailer from "nodemailer";
import { env } from "~/env";

interface MailOptionProps {
  email: string;
  subject: string;
  text: string;
}

const sendEmail = async (options: MailOptionProps) => {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_MAIL_HOST,
    port: env.SMTP_MAIL_PORT,
    service: env.SMTP_MAIL_SERVICE,
    auth: {
      user: env.SMTP_MAIL_USERNAME,
      pass: env.SMTP_MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: env.SMTP_MAIL_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;

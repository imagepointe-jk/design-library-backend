import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { QuoteRequest } from "./tempDbSchema";
import fs from "fs";
import handlebars from "handlebars";

const designLibraryUrl = (isDevMode: boolean) =>
  isDevMode
    ? "https://www.imagepointe.com/design-library"
    : "https://www.imagepointe.com/design-library"; //we may want to vary this later but not now

function sendEmail(recipientAddress: string, subject: string, message: string) {
  const fromAddress = process.env.NODEMAILER_FROM_ADDRESS;
  const password = process.env.NODEMAILER_FROM_PASSWORD;
  if (!fromAddress || !password) {
    console.error("Missing env variables for nodemailer");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: fromAddress,
      pass: password,
    },
  });
  const email: Mail.Options = {
    from: fromAddress,
    to: recipientAddress,
    subject,
    html: message,
  };
  transporter.sendMail(email, (err, info) => {
    if (err) {
      throw err;
    }
    console.log(`Successfully sent an email to ${recipientAddress}`);
  });
}

export function sendQuoteRequestEmail(quoteRequest: QuoteRequest) {
  const salesEmail = process.env.QUOTE_REQUEST_DEST_EMAIL;
  if (!salesEmail) {
    throw new Error("Missing sales email!");
  }

  try {
    const templateSource = fs.readFileSync("./quoteRequestEmail.hbs", "utf-8");
    const template = handlebars.compile(templateSource);
    const message = template(quoteRequest);

    sendEmail(salesEmail, "New Design Quote Request", message);
  } catch (error) {
    console.error("Failed to send a quote request!", quoteRequest);
  }
}

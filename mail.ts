import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { QuoteRequest } from "./tempDbSchema";

const designLibraryUrl = (isDevMode: boolean) =>
  isDevMode
    ? "https://www.imagepointe.com/design-library-development"
    : "https://www.imagepointe.com/design-library";

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

export function sendQuoteRequestEmail(
  quoteRequest: QuoteRequest,
  isDevMode: boolean
) {
  const {
    comments,
    designId,
    designNumber,
    garmentColor,
    email,
    firstName,
    lastName,
    phone,
    union,
  } = quoteRequest;
  const salesEmail = process.env.QUOTE_REQUEST_DEST_EMAIL;
  if (!salesEmail) {
    throw new Error("Missing sales email!");
  }

  const message = `A user has requested a quote for a design. The details of their submitted form are below.
        <ul>
        <li>First Name: ${firstName}</li>
        <li>Last Name: ${lastName}</li>
        <li>Email: ${email}</li>
        <li>Phone number: ${phone}</li>
        <li>Union: ${union}</li>
        <li>Comments: ${comments === "" ? "(No comments)" : comments}</li>
        <li>Design Number: ${designNumber}</li>
        <li>Garment Color: ${garmentColor}</li>
        </ul>
        The specific design they requested can be found at the following link. If you see multiple designs, the first one in the series will be the one they requested.
        <a href="${designLibraryUrl(
          isDevMode
        )}/?designId=${designId}">View Design</a>`;

  sendEmail(salesEmail, "New Design Quote Request", message);
}

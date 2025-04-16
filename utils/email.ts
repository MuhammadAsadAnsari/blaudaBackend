import nodemailer, { Transporter } from 'nodemailer';
import pug from 'pug';
import path from 'path';
import { Options as MailOptions } from 'nodemailer/lib/mailer';
import { htmlToText } from 'html-to-text'; // Correct import for v9+

interface User {
  email: string;
  name: string;
}

export default class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: User, url: string) {
    this.to = user.email;
    this.firstName = user.name;
    this.url = url;
    this.from = `AM Trading <${process.env.EMAIL_FROM}>`;
  }

  private newTransport(): Transporter {
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use false for port 587
      auth: {
        user: 'abdullahansari.eb19102002@gmail.com',
        pass: 'rryhmqmmplntumym',
      },
    });
  }

  private async send(
    template: string,
    subject: string,
    payload?: Record<string, any>
  ): Promise<void> {
    // Render HTML using pug template
    const html = pug.renderFile(
      path.join(__dirname, `../views/email/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
        payload,
      }
    );

    // Mail options
    const mailOptions: MailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html), // Correct conversion method
    };

    // Send the email
    await this.newTransport().sendMail(mailOptions);
  }

  public async sendQueryEmail(): Promise<void> {
    await this.send('sendQueryEmail', 'A user has posted a query');
  }
}

const nodemailer = require('nodemailer');
const pug = require('pug');
const ejs = require('ejs');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    // this.firstName = user.name.split(' ')[0];
    this.firstName = user.name;
    this.url = url;
    this.from = `Vibe Garden <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // Sendgrid
    return nodemailer.createTransport({
      service: 'gmail',
      host: "SMTP.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: 'owaiskahoo@gmail.com',
        pass: 'ngrqbkijnkiuuhvi',
      },
    });
  }

  // Send the actual email
  async send(template, subject, payload) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      payload,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Vibe Garden Family!');
  }

  async signupAndJobPost(payload) {
    await this.send(
      'signupJobPost',
      'Welcome to the Bee-Tute Family!',
      payload
    );
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendPasswordResetComfirmation() {
    await this.send(
      'passwordResetComfirmation',
      'Vibe Garden Password Change Notification'
    );
  }

  async sendWithdrawRequestEmail(payload) {
    await this.send('withdraw', 'Withdrawal Request', payload);
  }

  async sendUserRegisterEmail(payload) {
    await this.send(
      'registerUser',
      'Otp Code Email',
      payload
    );
  }

  async sendCoinsPurchasedEmail(payload) {
    await this.send('coinsPurchase', 'Coins Purchased', payload);
  }

  async sendApproveOrDisapproveEmailToUser(payload) {
    await this.send(
      'approveOrDisapproveUser',
      'Approve or Disapprove Account',
      payload
    );
  }
};

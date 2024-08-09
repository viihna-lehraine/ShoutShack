// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

const generate2FactorEmailTemplate =
  (username,
  (twoFactorEmail) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
          <head>
              <meta charset="UTF-8">
              <title>Guestbook - Account Confirmation</title>
              <style>
                  body {
                  margin: 0;
                  padding: 0;
                  background-color: #F4F4F4;
                  font-family: Arial, sans-serif;
                  }
                  .container {
                      width: 100%;
                      max-width: 600px;
                      padding: 20px;
                      border-radius: 5px;
                      margin: 20px auto;
                      background-color: #FFFFFF;
                  }
                  .header {
                      padding: 10px;
                      text-align: center;
                      border-radius: 5px 5px 0 0;
                      background-color: #007BFF;
                      color: #FFFFFF;
                  }
                  .content {
                      padding: 20px;
                  }
                  .content p {
                      font-size: 16px;
                  }
                  .button {
                      display: block;
                      width: 200px;
                      padding: 10px;
                      border-radius: 5px;
                      margin: 20px auto;
                      text-align: center;
                      background-color: #007BFF;
                      color: #FFFFFF;
                      text-decoration: none;
                  }
                  .footer {
                      text-align: center;
                      font-size: 12px;
                      padding: 10px;
                      color: #888888;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Guestbook - Your Login Code</h1>
                  </div>
                  <div class="content">
                      <p>Hello, ${username},</p>
                      <p>Here is the code you requested so that you may log into your acount. Please know that this code will be valid for the next 30 minutes. If you are unable to login by then, please request.
                      <h2>${emailVerificationCode}</h2>
                  </div>
                  <footer>
                      <p>If you did not request this code, then someone else may have access to your password and is trying to access your account. If this is the case, please log in and change your password at your earliest convenience.</p>
                      <p>Please feel free to reach out to my by sendi an email to me at <a href="mailto:admin@viihnatech.com" and I'll respond to you as soon as possible.</p>
                      <p>Have a great day! :)</p>
                  </footer>
              </div>
          </body>
      </html>
  `;
  });

export default generate2FactorEmailTemplate;
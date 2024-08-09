// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

const generate2FAEnabledEmailTemplate = (username) => {
  return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Guestbook - 2 Factor Authentication Enabled</title>
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
                        <h1>Guestbook - 2 Factor Authentication Enabled</h1>
                    </div>
                    <div class="content">
                        <p>Hello, ${username},</p>
                        <p>Two-factor authentciation has been enabled for your <a href="URL">Guestbook</a> account. If you did not perform this action, your account may be compromised. In that event, please reach out to me directly at <a href="mailto:admin@viihnatech.com">viihna@viihnatech.com</a< and I will investigate this as soon as possible.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

export default generate2FAEnabledEmailTemplate;
module.exports = (username, twoFactorEmail => {
    return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
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
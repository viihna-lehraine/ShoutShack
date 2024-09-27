import { ServiceFactory } from 'src/index/factory';
import { validateDependencies } from '../utils/helpers';

const generate2FactorEmailTemplate = (
	username: string,
	emailVerificationCode: string
): string => {
	const logger = ServiceFactory.getLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'emailVerificationCode', instance: emailVerificationCode }
		],
		logger
	);

	try {
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
    	                  <p>Here is the code you requested so that you may log into your account. Please know that this code will be valid for the next 30 minutes. If you are unable to login by then, please request a new code.</p>
    	                  <h2>${emailVerificationCode}</h2>
    	              </div>
    	              <div class="footer"> <!-- Correctly closing the footer with div for consistency -->
    	                  <p>If you did not request this code, then someone else may have access to your password and is trying to access your account. If this is the case, please log in and change your password at your earliest convenience.</p>
    	                  <p>Please feel free to reach out to me by sending an email to <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a> and I'll respond to you as soon as possible.</p>
    	                  <p>Have a great day! :)</p>
    	              </div>
    	          </div>
    	      </body>
    	  </html>
    	`;
	} catch (error) {
		errorHandler.handleError({ error });
		throw new Error(
			`Failed to generate 2-factor email template: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
};

export default generate2FactorEmailTemplate;

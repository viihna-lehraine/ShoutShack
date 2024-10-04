import { ServiceFactory } from '../index/factory';
import { validateDependencies } from '../utils/helpers';

const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();

const generateAccountDeletedConfirmationEmailTemplate = (
	username: string
): string => {
	validateDependencies([{ name: 'username', instance: username }], logger);

	try {
		return `
    	    <!DOCTYPE html>
    	    <html lang="en">
    	        <head>
    	            <meta charset="UTF-8">
    	            <title>Guestbook - Your Account Has Been Deleted</title>
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
    	                    <h1>Guestbook - Your Account Has Been Deleted</h1>
    	                </div>
    	                <div class="content">
    	                    <p>Hello, ${username},</p>
    	                    <p>We wanted to let you know that your Guestbook account has been successfully deleted. All your data has been permanently removed from our systems.</p>
    	                    <p>If you have any questions or believe this was a mistake, please do not hesitate to reach out to us at <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a>.</p>
    	                    <p>Thank you for being a part of our community.</p>
    	                </div>
    	                <div class="footer">
    	                    <p>&copy; ${new Date().getFullYear()} Guestbook. All rights reserved.</p>
    	                </div>
    	            </div>
    	        </body>
    	    </html>
    	`;
	} catch (error) {
		errorHandler.handleError({ error });
		throw new Error(
			`Failed to generate account deleted confirmation email template: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
};

export default generateAccountDeletedConfirmationEmailTemplate;

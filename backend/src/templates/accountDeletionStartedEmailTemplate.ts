import { Logger } from '../config/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';

const generateAccountDeletionStartedEmailTemplate = (
	username: string,
	logger: Logger
): string => {
	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'logger', instance: logger }
		],
		logger
	);

	try {
		return `
    	    <!DOCTYPE html>
    	    <html lang="en">
    	        <head>
    	            <meta charset="UTF-8">
    	            <title>Guestbook - IMPORTANT! Account Deletion Process Started</title>
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
    	                    <h1>Guestbook - IMPORTANT! Account Deletion Process Started</h1>
    	                </div>
    	                <div class="content">
    	                    <p>Hello, ${username},</p>
    	                    <p>We have received a request to delete your Guestbook account. This process will permanently remove your account and all associated data from our system.</p>
    	                    <p>If you did not initiate this request, please contact us immediately to stop the deletion process. You can reach us at <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a>.</p>
    	                    <p>Once the deletion process is complete, you will receive another email confirming that your account has been deleted.</p>
    	                </div>
    	                <div class="footer">
    	                    <p>&copy; ${new Date().getFullYear()} Guestbook. All rights reserved.</p>
    	                </div>
    	            </div>
    	        </body>
    	    </html>
    	`;
	} catch (error) {
		processError(error, logger);
		throw new Error(
			`Failed to generate account deletion started email template: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
};

export default generateAccountDeletionStartedEmailTemplate;

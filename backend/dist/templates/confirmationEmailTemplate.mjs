import { ServiceFactory } from '../index/factory.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
const errorLogger = await ServiceFactory.getErrorLoggerService();
export const generateConfirmationEmailTemplate = (
	username,
	confirmationUrl
) => {
	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'confirmationUrl', instance: confirmationUrl }
		],
		logger || console
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
    	                    <h1>Guestbook - Account Confirmation</h1>
    	                </div>
    	                <div class="content">
    	                    <p>Hello, ${username},</p>
    	                    <p>Thank you for registering your account at guestbook.com! I'm so glad you've chosen to join our community.</p>
    	                    <p>Please click the button below or copy and paste the link into your browser to confirm your account, and your account will be fully registered.</p>
    	                    <a href="${confirmationUrl}" class="button">Confirm Email</a>
    	                    <p>${confirmationUrl}</p>
    	                </div>
    	                <div class="footer">
    	                    <p>If you did not register for an account at guestbook.com, please ignore this email.</p>
    	                    <p>If you experience any issues registering your account, please send an email to me at <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a> and I'll respond to you as soon as possible.</p>
    	                    <p>Have a great day! :)</p>
    	                </div>
    	            </div>
    	        </body>
    	    </html>
    	`;
	} catch (error) {
		const templateError =
			new errorHandler.ErrorClasses.DependencyErrorRecoverable(
				`Failed to generate confirmation email template: ${error instanceof Error ? error.message : String(error)}`,
				{
					dependency: 'generateConfirmationEmailTemplate()',
					originalError: error,
					exposeToClient: false
				}
			);
		errorLogger.logError(templateError.message);
		errorHandler.handleError({ error: templateError });
		throw templateError;
	}
};
export default generateConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZW1wbGF0ZXMvY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDbEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFeEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxNQUFNLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQ25FLE1BQU0sV0FBVyxHQUFHLE1BQU0sY0FBYyxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFFakUsTUFBTSxDQUFDLE1BQU0saUNBQWlDLEdBQUcsQ0FDaEQsUUFBZ0IsRUFDaEIsZUFBdUIsRUFDZCxFQUFFO0lBQ1gsb0JBQW9CLENBQ25CO1FBQ0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7UUFDeEMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRTtLQUN0RCxFQUNELE1BQU0sSUFBSSxPQUFPLENBQ2pCLENBQUM7SUFFRixJQUFJLENBQUM7UUFDSixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0EyRDRCLFFBQVE7OztvQ0FHVCxlQUFlOzhCQUNyQixlQUFlOzs7Ozs7Ozs7O01BVXZDLENBQUM7SUFDTixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixNQUFNLGFBQWEsR0FDbEIsSUFBSSxZQUFZLENBQUMsWUFBWSxDQUFDLDBCQUEwQixDQUN2RCxtREFBbUQsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQzNHO1lBQ0MsVUFBVSxFQUFFLHFDQUFxQztZQUNqRCxhQUFhLEVBQUUsS0FBSztZQUNwQixjQUFjLEVBQUUsS0FBSztTQUNyQixDQUNELENBQUM7UUFDSCxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDbkQsTUFBTSxhQUFhLENBQUM7SUFDckIsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLGVBQWUsaUNBQWlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3RvcnknO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy9oZWxwZXJzJztcblxuY29uc3QgbG9nZ2VyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0TG9nZ2VyU2VydmljZSgpO1xuY29uc3QgZXJyb3JIYW5kbGVyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JIYW5kbGVyU2VydmljZSgpO1xuY29uc3QgZXJyb3JMb2dnZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckxvZ2dlclNlcnZpY2UoKTtcblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0Y29uZmlybWF0aW9uVXJsOiBzdHJpbmdcbik6IHN0cmluZyA9PiB7XG5cdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFtcblx0XHRcdHsgbmFtZTogJ3VzZXJuYW1lJywgaW5zdGFuY2U6IHVzZXJuYW1lIH0sXG5cdFx0XHR7IG5hbWU6ICdjb25maXJtYXRpb25VcmwnLCBpbnN0YW5jZTogY29uZmlybWF0aW9uVXJsIH1cblx0XHRdLFxuXHRcdGxvZ2dlciB8fCBjb25zb2xlXG5cdCk7XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gYFxuICAgIFx0ICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIFx0ICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgIFx0ICAgICAgICA8aGVhZD5cbiAgICBcdCAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIFx0ICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIEFjY291bnQgQ29uZmlybWF0aW9uPC90aXRsZT5cbiAgICBcdCAgICAgICAgICAgIDxzdHlsZT5cbiAgICBcdCAgICAgICAgICAgICAgICBib2R5IHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgPC9zdHlsZT5cbiAgICBcdCAgICAgICAgPC9oZWFkPlxuICAgIFx0ICAgICAgICA8Ym9keT5cbiAgICBcdCAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSBBY2NvdW50IENvbmZpcm1hdGlvbjwvaDE+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+VGhhbmsgeW91IGZvciByZWdpc3RlcmluZyB5b3VyIGFjY291bnQgYXQgZ3Vlc3Rib29rLmNvbSEgSSdtIHNvIGdsYWQgeW91J3ZlIGNob3NlbiB0byBqb2luIG91ciBjb21tdW5pdHkuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyBvciBjb3B5IGFuZCBwYXN0ZSB0aGUgbGluayBpbnRvIHlvdXIgYnJvd3NlciB0byBjb25maXJtIHlvdXIgYWNjb3VudCwgYW5kIHlvdXIgYWNjb3VudCB3aWxsIGJlIGZ1bGx5IHJlZ2lzdGVyZWQuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHtjb25maXJtYXRpb25Vcmx9XCIgY2xhc3M9XCJidXR0b25cIj5Db25maXJtIEVtYWlsPC9hPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD4ke2NvbmZpcm1hdGlvblVybH08L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCByZWdpc3RlciBmb3IgYW4gYWNjb3VudCBhdCBndWVzdGJvb2suY29tLCBwbGVhc2UgaWdub3JlIHRoaXMgZW1haWwuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZXhwZXJpZW5jZSBhbnkgaXNzdWVzIHJlZ2lzdGVyaW5nIHlvdXIgYWNjb3VudCwgcGxlYXNlIHNlbmQgYW4gZW1haWwgdG8gbWUgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSdsbCByZXNwb25kIHRvIHlvdSBhcyBzb29uIGFzIHBvc3NpYmxlLjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+SGF2ZSBhIGdyZWF0IGRheSEgOik8L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgPC9ib2R5PlxuICAgIFx0ICAgIDwvaHRtbD5cbiAgICBcdGA7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Y29uc3QgdGVtcGxhdGVFcnJvciA9XG5cdFx0XHRuZXcgZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5EZXBlbmRlbmN5RXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSBjb25maXJtYXRpb24gZW1haWwgdGVtcGxhdGU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkZXBlbmRlbmN5OiAnZ2VuZXJhdGVDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlKCknLFxuXHRcdFx0XHRcdG9yaWdpbmFsRXJyb3I6IGVycm9yLFxuXHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdGVycm9yTG9nZ2VyLmxvZ0Vycm9yKHRlbXBsYXRlRXJyb3IubWVzc2FnZSk7XG5cdFx0ZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IHRlbXBsYXRlRXJyb3IgfSk7XG5cdFx0dGhyb3cgdGVtcGxhdGVFcnJvcjtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlO1xuIl19

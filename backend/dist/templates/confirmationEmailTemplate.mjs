import { processError } from '../utils/processError.mjs';
import { validateDependencies } from '../utils/validateDependencies.mjs';
const generateConfirmationEmailTemplate = (
	username,
	confirmationUrl,
	logger
) => {
	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'confirmationUrl', instance: confirmationUrl },
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
		processError(error, logger);
		throw new Error(
			`Failed to generate confirmation email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generateConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZW1wbGF0ZXMvY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFckUsTUFBTSxpQ0FBaUMsR0FBRyxDQUN6QyxRQUFnQixFQUNoQixlQUF1QixFQUN2QixNQUFjLEVBQ0wsRUFBRTtJQUNYLG9CQUFvQixDQUNuQjtRQUNDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFO1FBQ3hDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUU7UUFDdEQsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7S0FDcEMsRUFDRCxNQUFNLENBQ04sQ0FBQztJQUVGLElBQUksQ0FBQztRQUNKLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQTJENEIsUUFBUTs7O29DQUdULGVBQWU7OEJBQ3JCLGVBQWU7Ozs7Ozs7Ozs7TUFVdkMsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FDZCxtREFDQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUN0RCxFQUFFLENBQ0YsQ0FBQztJQUNILENBQUM7QUFDRixDQUFDLENBQUM7QUFFRixlQUFlLGlDQUFpQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyBwcm9jZXNzRXJyb3IgfSBmcm9tICcuLi91dGlscy9wcm9jZXNzRXJyb3InO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy92YWxpZGF0ZURlcGVuZGVuY2llcyc7XG5cbmNvbnN0IGdlbmVyYXRlQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0Y29uZmlybWF0aW9uVXJsOiBzdHJpbmcsXG5cdGxvZ2dlcjogTG9nZ2VyXG4pOiBzdHJpbmcgPT4ge1xuXHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRbXG5cdFx0XHR7IG5hbWU6ICd1c2VybmFtZScsIGluc3RhbmNlOiB1c2VybmFtZSB9LFxuXHRcdFx0eyBuYW1lOiAnY29uZmlybWF0aW9uVXJsJywgaW5zdGFuY2U6IGNvbmZpcm1hdGlvblVybCB9LFxuXHRcdFx0eyBuYW1lOiAnbG9nZ2VyJywgaW5zdGFuY2U6IGxvZ2dlciB9XG5cdFx0XSxcblx0XHRsb2dnZXJcblx0KTtcblxuXHR0cnkge1xuXHRcdHJldHVybiBgXG4gICAgXHQgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgXHQgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgXHQgICAgICAgIDxoZWFkPlxuICAgIFx0ICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgXHQgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gQWNjb3VudCBDb25maXJtYXRpb248L3RpdGxlPlxuICAgIFx0ICAgICAgICAgICAgPHN0eWxlPlxuICAgIFx0ICAgICAgICAgICAgICAgIGJvZHkge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICA8L3N0eWxlPlxuICAgIFx0ICAgICAgICA8L2hlYWQ+XG4gICAgXHQgICAgICAgIDxib2R5PlxuICAgIFx0ICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIEFjY291bnQgQ29uZmlybWF0aW9uPC9oMT5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5UaGFuayB5b3UgZm9yIHJlZ2lzdGVyaW5nIHlvdXIgYWNjb3VudCBhdCBndWVzdGJvb2suY29tISBJJ20gc28gZ2xhZCB5b3UndmUgY2hvc2VuIHRvIGpvaW4gb3VyIGNvbW11bml0eS48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPlBsZWFzZSBjbGljayB0aGUgYnV0dG9uIGJlbG93IG9yIGNvcHkgYW5kIHBhc3RlIHRoZSBsaW5rIGludG8geW91ciBicm93c2VyIHRvIGNvbmZpcm0geW91ciBhY2NvdW50LCBhbmQgeW91ciBhY2NvdW50IHdpbGwgYmUgZnVsbHkgcmVnaXN0ZXJlZC48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke2NvbmZpcm1hdGlvblVybH1cIiBjbGFzcz1cImJ1dHRvblwiPkNvbmZpcm0gRW1haWw8L2E+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPiR7Y29uZmlybWF0aW9uVXJsfTwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IHJlZ2lzdGVyIGZvciBhbiBhY2NvdW50IGF0IGd1ZXN0Ym9vay5jb20sIHBsZWFzZSBpZ25vcmUgdGhpcyBlbWFpbC48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBleHBlcmllbmNlIGFueSBpc3N1ZXMgcmVnaXN0ZXJpbmcgeW91ciBhY2NvdW50LCBwbGVhc2Ugc2VuZCBhbiBlbWFpbCB0byBtZSBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+IGFuZCBJJ2xsIHJlc3BvbmQgdG8geW91IGFzIHNvb24gYXMgcG9zc2libGUuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5IYXZlIGEgZ3JlYXQgZGF5ISA6KTwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICA8L2JvZHk+XG4gICAgXHQgICAgPC9odG1sPlxuICAgIFx0YDtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyb3IsIGxvZ2dlcik7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSBjb25maXJtYXRpb24gZW1haWwgdGVtcGxhdGU6ICR7XG5cdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuXHRcdFx0fWBcblx0XHQpO1xuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBnZW5lcmF0ZUNvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGU7XG4iXX0=

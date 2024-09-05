import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
const generate2FactorEmailTemplate = (
	username,
	emailVerificationCode,
	logger
) => {
	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'emailVerificationCode', instance: emailVerificationCode },
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
		processError(error, logger);
		throw new Error(
			`Failed to generate 2-factor email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generate2FactorEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMkZhY3RvckVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzLzJGYWN0b3JFbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxNQUFNLDRCQUE0QixHQUFHLENBQ3BDLFFBQWdCLEVBQ2hCLHFCQUE2QixFQUM3QixNQUFjLEVBQ0wsRUFBRTtJQUNYLG9CQUFvQixDQUNuQjtRQUNDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFO1FBQ3hDLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRTtRQUNsRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRTtLQUNwQyxFQUNELE1BQU0sQ0FDTixDQUFDO0lBRUYsSUFBSSxDQUFDO1FBQ0osT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7bUNBMkQwQixRQUFROzs2QkFFZCxxQkFBcUI7Ozs7Ozs7Ozs7TUFVNUMsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FDZCwrQ0FDQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUN0RCxFQUFFLENBQ0YsQ0FBQztJQUNILENBQUM7QUFDRixDQUFDLENBQUM7QUFFRixlQUFlLDRCQUE0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcbmltcG9ydCB7IHByb2Nlc3NFcnJvciB9IGZyb20gJy4uL3V0aWxzL3Byb2Nlc3NFcnJvcic7XG5cbmNvbnN0IGdlbmVyYXRlMkZhY3RvckVtYWlsVGVtcGxhdGUgPSAoXG5cdHVzZXJuYW1lOiBzdHJpbmcsXG5cdGVtYWlsVmVyaWZpY2F0aW9uQ29kZTogc3RyaW5nLFxuXHRsb2dnZXI6IExvZ2dlclxuKTogc3RyaW5nID0+IHtcblx0dmFsaWRhdGVEZXBlbmRlbmNpZXMoXG5cdFx0W1xuXHRcdFx0eyBuYW1lOiAndXNlcm5hbWUnLCBpbnN0YW5jZTogdXNlcm5hbWUgfSxcblx0XHRcdHsgbmFtZTogJ2VtYWlsVmVyaWZpY2F0aW9uQ29kZScsIGluc3RhbmNlOiBlbWFpbFZlcmlmaWNhdGlvbkNvZGUgfSxcblx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdF0sXG5cdFx0bG9nZ2VyXG5cdCk7XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gYFxuICAgIFx0ICA8IURPQ1RZUEUgaHRtbD5cbiAgICBcdCAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgXHQgICAgICA8aGVhZD5cbiAgICBcdCAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICBcdCAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gQWNjb3VudCBDb25maXJtYXRpb248L3RpdGxlPlxuICAgIFx0ICAgICAgICAgIDxzdHlsZT5cbiAgICBcdCAgICAgICAgICAgICAgYm9keSB7XG4gICAgXHQgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICBcdCAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICBcdCAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICBcdCAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgIFx0ICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgXHQgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgIFx0ICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgXHQgICAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgXHQgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgXHQgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICA8L3N0eWxlPlxuICAgIFx0ICAgICAgPC9oZWFkPlxuICAgIFx0ICAgICAgPGJvZHk+XG4gICAgXHQgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgIFx0ICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gWW91ciBMb2dpbiBDb2RlPC9oMT5cbiAgICBcdCAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgPHA+SGVyZSBpcyB0aGUgY29kZSB5b3UgcmVxdWVzdGVkIHNvIHRoYXQgeW91IG1heSBsb2cgaW50byB5b3VyIGFjY291bnQuIFBsZWFzZSBrbm93IHRoYXQgdGhpcyBjb2RlIHdpbGwgYmUgdmFsaWQgZm9yIHRoZSBuZXh0IDMwIG1pbnV0ZXMuIElmIHlvdSBhcmUgdW5hYmxlIHRvIGxvZ2luIGJ5IHRoZW4sIHBsZWFzZSByZXF1ZXN0IGEgbmV3IGNvZGUuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgPGgyPiR7ZW1haWxWZXJpZmljYXRpb25Db2RlfTwvaDI+XG4gICAgXHQgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+IDwhLS0gQ29ycmVjdGx5IGNsb3NpbmcgdGhlIGZvb3RlciB3aXRoIGRpdiBmb3IgY29uc2lzdGVuY3kgLS0+XG4gICAgXHQgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCByZXF1ZXN0IHRoaXMgY29kZSwgdGhlbiBzb21lb25lIGVsc2UgbWF5IGhhdmUgYWNjZXNzIHRvIHlvdXIgcGFzc3dvcmQgYW5kIGlzIHRyeWluZyB0byBhY2Nlc3MgeW91ciBhY2NvdW50LiBJZiB0aGlzIGlzIHRoZSBjYXNlLCBwbGVhc2UgbG9nIGluIGFuZCBjaGFuZ2UgeW91ciBwYXNzd29yZCBhdCB5b3VyIGVhcmxpZXN0IGNvbnZlbmllbmNlLjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgIDxwPlBsZWFzZSBmZWVsIGZyZWUgdG8gcmVhY2ggb3V0IHRvIG1lIGJ5IHNlbmRpbmcgYW4gZW1haWwgdG8gPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSdsbCByZXNwb25kIHRvIHlvdSBhcyBzb29uIGFzIHBvc3NpYmxlLjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgIDxwPkhhdmUgYSBncmVhdCBkYXkhIDopPC9wPlxuICAgIFx0ICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgIDwvYm9keT5cbiAgICBcdCAgPC9odG1sPlxuICAgIFx0YDtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyb3IsIGxvZ2dlcik7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSAyLWZhY3RvciBlbWFpbCB0ZW1wbGF0ZTogJHtcblx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG5cdFx0XHR9YFxuXHRcdCk7XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGdlbmVyYXRlMkZhY3RvckVtYWlsVGVtcGxhdGU7XG4iXX0=

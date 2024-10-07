import { ServiceFactory } from '../index/factory/ServiceFactory.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
export const generateEmailMFATemplate = (username, emailVerificationCode) => {
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
    	                  <h1>BrainBlot - Your Login Code</h1>
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
			`Failed to generate 2-factor email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWxNRkFDb2RlVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzL2VtYWlsTUZBQ29kZVRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3ZELE1BQU0sWUFBWSxHQUFHLE1BQU0sY0FBYyxDQUFDLHNCQUFzQixFQUFFLENBQUM7QUFFbkUsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsQ0FDdkMsUUFBZ0IsRUFDaEIscUJBQTZCLEVBQ3BCLEVBQUU7SUFDWCxvQkFBb0IsQ0FDbkI7UUFDQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTtRQUN4QyxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUU7S0FDbEUsRUFDRCxNQUFNLENBQ04sQ0FBQztJQUVGLElBQUksQ0FBQztRQUNKLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21DQTJEMEIsUUFBUTs7NkJBRWQscUJBQXFCOzs7Ozs7Ozs7O01BVTVDLENBQUM7SUFDTixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNwQyxNQUFNLElBQUksS0FBSyxDQUNkLCtDQUNDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ3RELEVBQUUsQ0FDRixDQUFDO0lBQ0gsQ0FBQztBQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9TZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuXG5jb25zdCBsb2dnZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5jb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZUVtYWlsTUZBVGVtcGxhdGUgPSAoXG5cdHVzZXJuYW1lOiBzdHJpbmcsXG5cdGVtYWlsVmVyaWZpY2F0aW9uQ29kZTogc3RyaW5nXG4pOiBzdHJpbmcgPT4ge1xuXHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRbXG5cdFx0XHR7IG5hbWU6ICd1c2VybmFtZScsIGluc3RhbmNlOiB1c2VybmFtZSB9LFxuXHRcdFx0eyBuYW1lOiAnZW1haWxWZXJpZmljYXRpb25Db2RlJywgaW5zdGFuY2U6IGVtYWlsVmVyaWZpY2F0aW9uQ29kZSB9XG5cdFx0XSxcblx0XHRsb2dnZXJcblx0KTtcblxuXHR0cnkge1xuXHRcdHJldHVybiBgXG4gICAgXHQgIDwhRE9DVFlQRSBodG1sPlxuICAgIFx0ICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICBcdCAgICAgIDxoZWFkPlxuICAgIFx0ICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIFx0ICAgICAgICAgIDx0aXRsZT5HdWVzdGJvb2sgLSBBY2NvdW50IENvbmZpcm1hdGlvbjwvdGl0bGU+XG4gICAgXHQgICAgICAgICAgPHN0eWxlPlxuICAgIFx0ICAgICAgICAgICAgICBib2R5IHtcbiAgICBcdCAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgIFx0ICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgIFx0ICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgIFx0ICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgXHQgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICBcdCAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgXHQgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgXHQgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICBcdCAgICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICBcdCAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICBcdCAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICBcdCAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgIDwvc3R5bGU+XG4gICAgXHQgICAgICA8L2hlYWQ+XG4gICAgXHQgICAgICA8Ym9keT5cbiAgICBcdCAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgXHQgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgIDxoMT5CcmFpbkJsb3QgLSBZb3VyIExvZ2luIENvZGU8L2gxPlxuICAgIFx0ICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICA8cD5IZXJlIGlzIHRoZSBjb2RlIHlvdSByZXF1ZXN0ZWQgc28gdGhhdCB5b3UgbWF5IGxvZyBpbnRvIHlvdXIgYWNjb3VudC4gUGxlYXNlIGtub3cgdGhhdCB0aGlzIGNvZGUgd2lsbCBiZSB2YWxpZCBmb3IgdGhlIG5leHQgMzAgbWludXRlcy4gSWYgeW91IGFyZSB1bmFibGUgdG8gbG9naW4gYnkgdGhlbiwgcGxlYXNlIHJlcXVlc3QgYSBuZXcgY29kZS48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICA8aDI+JHtlbWFpbFZlcmlmaWNhdGlvbkNvZGV9PC9oMj5cbiAgICBcdCAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj4gPCEtLSBDb3JyZWN0bHkgY2xvc2luZyB0aGUgZm9vdGVyIHdpdGggZGl2IGZvciBjb25zaXN0ZW5jeSAtLT5cbiAgICBcdCAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IHJlcXVlc3QgdGhpcyBjb2RlLCB0aGVuIHNvbWVvbmUgZWxzZSBtYXkgaGF2ZSBhY2Nlc3MgdG8geW91ciBwYXNzd29yZCBhbmQgaXMgdHJ5aW5nIHRvIGFjY2VzcyB5b3VyIGFjY291bnQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHBsZWFzZSBsb2cgaW4gYW5kIGNoYW5nZSB5b3VyIHBhc3N3b3JkIGF0IHlvdXIgZWFybGllc3QgY29udmVuaWVuY2UuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgPHA+UGxlYXNlIGZlZWwgZnJlZSB0byByZWFjaCBvdXQgdG8gbWUgYnkgc2VuZGluZyBhbiBlbWFpbCB0byA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+IGFuZCBJJ2xsIHJlc3BvbmQgdG8geW91IGFzIHNvb24gYXMgcG9zc2libGUuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgPHA+SGF2ZSBhIGdyZWF0IGRheSEgOik8L3A+XG4gICAgXHQgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgPC9ib2R5PlxuICAgIFx0ICA8L2h0bWw+XG4gICAgXHRgO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yIH0pO1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdGBGYWlsZWQgdG8gZ2VuZXJhdGUgMi1mYWN0b3IgZW1haWwgdGVtcGxhdGU6ICR7XG5cdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuXHRcdFx0fWBcblx0XHQpO1xuXHR9XG59O1xuIl19

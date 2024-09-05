import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
const generate2FAEnabledEmailTemplate = (username, logger) => {
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
    	                    <p>Two-factor authentication has been enabled for your <a href="URL">Guestbook</a> account. If you did not perform this action, your account may be compromised. In that event, please reach out to me directly at <a href="mailto:admin@viihnatech.com">viihna@viihnatech.com</a> and I will investigate this as soon as possible.</p>
    	                </div>
    	            </div>
    	        </body>
    	    </html>
    	`;
	} catch (error) {
		processError(error, logger);
		throw new Error(
			`Failed to generate 2FA enabled email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generate2FAEnabledEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMkZBRW5hYmxlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzLzJGQUVuYWJsZWRFbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxNQUFNLCtCQUErQixHQUFHLENBQ3ZDLFFBQWdCLEVBQ2hCLE1BQWMsRUFDTCxFQUFFO0lBQ1gsb0JBQW9CLENBQ25CO1FBQ0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7UUFDeEMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7S0FDcEMsRUFDRCxNQUFNLENBQ04sQ0FBQztJQUVGLElBQUksQ0FBQztRQUNKLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQTJENEIsUUFBUTs7Ozs7O01BTXZDLENBQUM7SUFDTixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLE1BQU0sSUFBSSxLQUFLLENBQ2Qsa0RBQ0MsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDdEQsRUFBRSxDQUNGLENBQUM7SUFDSCxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBRUYsZUFBZSwrQkFBK0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2NvbmZpZy9sb2dnZXInO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy92YWxpZGF0ZURlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBwcm9jZXNzRXJyb3IgfSBmcm9tICcuLi91dGlscy9wcm9jZXNzRXJyb3InO1xuXG5jb25zdCBnZW5lcmF0ZTJGQUVuYWJsZWRFbWFpbFRlbXBsYXRlID0gKFxuXHR1c2VybmFtZTogc3RyaW5nLFxuXHRsb2dnZXI6IExvZ2dlclxuKTogc3RyaW5nID0+IHtcblx0dmFsaWRhdGVEZXBlbmRlbmNpZXMoXG5cdFx0W1xuXHRcdFx0eyBuYW1lOiAndXNlcm5hbWUnLCBpbnN0YW5jZTogdXNlcm5hbWUgfSxcblx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdF0sXG5cdFx0bG9nZ2VyXG5cdCk7XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gYFxuICAgIFx0ICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIFx0ICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgIFx0ICAgICAgICA8aGVhZD5cbiAgICBcdCAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIFx0ICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIDIgRmFjdG9yIEF1dGhlbnRpY2F0aW9uIEVuYWJsZWQ8L3RpdGxlPlxuICAgIFx0ICAgICAgICAgICAgPHN0eWxlPlxuICAgIFx0ICAgICAgICAgICAgICAgIGJvZHkge1xuICAgIFx0ICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICBcdCAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgXHQgICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRlbnQge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGVudCBwIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuYnV0dG9uIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgXHQgICAgICAgIDwvaGVhZD5cbiAgICBcdCAgICAgICAgPGJvZHk+XG4gICAgXHQgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gMiBGYWN0b3IgQXV0aGVudGljYXRpb24gRW5hYmxlZDwvaDE+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+VHdvLWZhY3RvciBhdXRoZW50aWNhdGlvbiBoYXMgYmVlbiBlbmFibGVkIGZvciB5b3VyIDxhIGhyZWY9XCJVUkxcIj5HdWVzdGJvb2s8L2E+IGFjY291bnQuIElmIHlvdSBkaWQgbm90IHBlcmZvcm0gdGhpcyBhY3Rpb24sIHlvdXIgYWNjb3VudCBtYXkgYmUgY29tcHJvbWlzZWQuIEluIHRoYXQgZXZlbnQsIHBsZWFzZSByZWFjaCBvdXQgdG8gbWUgZGlyZWN0bHkgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPnZpaWhuYUB2aWlobmF0ZWNoLmNvbTwvYT4gYW5kIEkgd2lsbCBpbnZlc3RpZ2F0ZSB0aGlzIGFzIHNvb24gYXMgcG9zc2libGUuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgIDwvYm9keT5cbiAgICBcdCAgICA8L2h0bWw+XG4gICAgXHRgO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHByb2Nlc3NFcnJvcihlcnJvciwgbG9nZ2VyKTtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRgRmFpbGVkIHRvIGdlbmVyYXRlIDJGQSBlbmFibGVkIGVtYWlsIHRlbXBsYXRlOiAke1xuXHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdH1gXG5cdFx0KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGUyRkFFbmFibGVkRW1haWxUZW1wbGF0ZTtcbiJdfQ==

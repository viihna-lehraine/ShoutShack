import { validateDependencies } from '../utils/helpers.mjs';
import { ServiceFactory } from '../index/factory.mjs';
const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
export const generateMFAEnabledEmailTemplate = username => {
	validateDependencies([{ name: 'username', instance: username }], logger);
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
		errorHandler.handleError({ error });
		throw new Error(
			`Failed to generate 2FA enabled email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTUZBRW5hYmxlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzL01GQUVuYWJsZWRFbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUVsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3ZELE1BQU0sWUFBWSxHQUFHLE1BQU0sY0FBYyxDQUFDLHNCQUFzQixFQUFFLENBQUM7QUFFbkUsTUFBTSxDQUFDLE1BQU0sK0JBQStCLEdBQUcsQ0FBQyxRQUFnQixFQUFVLEVBQUU7SUFDM0Usb0JBQW9CLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFekUsSUFBSSxDQUFDO1FBQ0osT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUNBMkQ0QixRQUFROzs7Ozs7TUFNdkMsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2Qsa0RBQ0MsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDdEQsRUFBRSxDQUNGLENBQUM7SUFDSCxDQUFDO0FBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy9oZWxwZXJzJztcbmltcG9ydCB7IFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeSc7XG5cbmNvbnN0IGxvZ2dlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldExvZ2dlclNlcnZpY2UoKTtcbmNvbnN0IGVycm9ySGFuZGxlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEVycm9ySGFuZGxlclNlcnZpY2UoKTtcblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlTUZBRW5hYmxlZEVtYWlsVGVtcGxhdGUgPSAodXNlcm5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG5cdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFt7IG5hbWU6ICd1c2VybmFtZScsIGluc3RhbmNlOiB1c2VybmFtZSB9XSwgbG9nZ2VyKTtcblxuXHR0cnkge1xuXHRcdHJldHVybiBgXG4gICAgXHQgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgXHQgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgXHQgICAgICAgIDxoZWFkPlxuICAgIFx0ICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgXHQgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gMiBGYWN0b3IgQXV0aGVudGljYXRpb24gRW5hYmxlZDwvdGl0bGU+XG4gICAgXHQgICAgICAgICAgICA8c3R5bGU+XG4gICAgXHQgICAgICAgICAgICAgICAgYm9keSB7XG4gICAgXHQgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICBcdCAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgPC9zdHlsZT5cbiAgICBcdCAgICAgICAgPC9oZWFkPlxuICAgIFx0ICAgICAgICA8Ym9keT5cbiAgICBcdCAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSAyIEZhY3RvciBBdXRoZW50aWNhdGlvbiBFbmFibGVkPC9oMT5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5Ud28tZmFjdG9yIGF1dGhlbnRpY2F0aW9uIGhhcyBiZWVuIGVuYWJsZWQgZm9yIHlvdXIgPGEgaHJlZj1cIlVSTFwiPkd1ZXN0Ym9vazwvYT4gYWNjb3VudC4gSWYgeW91IGRpZCBub3QgcGVyZm9ybSB0aGlzIGFjdGlvbiwgeW91ciBhY2NvdW50IG1heSBiZSBjb21wcm9taXNlZC4gSW4gdGhhdCBldmVudCwgcGxlYXNlIHJlYWNoIG91dCB0byBtZSBkaXJlY3RseSBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+dmlpaG5hQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSB3aWxsIGludmVzdGlnYXRlIHRoaXMgYXMgc29vbiBhcyBwb3NzaWJsZS48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgPC9ib2R5PlxuICAgIFx0ICAgIDwvaHRtbD5cbiAgICBcdGA7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0ZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3IgfSk7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSAyRkEgZW5hYmxlZCBlbWFpbCB0ZW1wbGF0ZTogJHtcblx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG5cdFx0XHR9YFxuXHRcdCk7XG5cdH1cbn07XG4iXX0=

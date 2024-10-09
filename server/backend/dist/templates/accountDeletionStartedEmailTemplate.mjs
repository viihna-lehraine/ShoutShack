import { ServiceFactory } from '../index/factory/ServiceFactory.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
const generateAccountDeletionStartedEmailTemplate = username => {
	validateDependencies([{ name: 'username', instance: username }], logger);
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
		errorHandler.handleError({ error });
		throw new Error(
			`Failed to generate account deletion started email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generateAccountDeletionStartedEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzL2FjY291bnREZWxldGlvblN0YXJ0ZWRFbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3ZELE1BQU0sWUFBWSxHQUFHLE1BQU0sY0FBYyxDQUFDLHNCQUFzQixFQUFFLENBQUM7QUFFbkUsTUFBTSwyQ0FBMkMsR0FBRyxDQUNuRCxRQUFnQixFQUNQLEVBQUU7SUFDWCxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUV6RSxJQUFJLENBQUM7UUFDSixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0EyRDRCLFFBQVE7Ozs7OztxQ0FNUixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTs7Ozs7TUFLdkQsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2QsK0RBQ0MsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDdEQsRUFBRSxDQUNGLENBQUM7SUFDSCxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBRUYsZUFBZSwyQ0FBMkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9TZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuXG5jb25zdCBsb2dnZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5jb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cbmNvbnN0IGdlbmVyYXRlQWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUgPSAoXG5cdHVzZXJuYW1lOiBzdHJpbmdcbik6IHN0cmluZyA9PiB7XG5cdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFt7IG5hbWU6ICd1c2VybmFtZScsIGluc3RhbmNlOiB1c2VybmFtZSB9XSwgbG9nZ2VyKTtcblxuXHR0cnkge1xuXHRcdHJldHVybiBgXG4gICAgXHQgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgXHQgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgXHQgICAgICAgIDxoZWFkPlxuICAgIFx0ICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgXHQgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gSU1QT1JUQU5UISBBY2NvdW50IERlbGV0aW9uIFByb2Nlc3MgU3RhcnRlZDwvdGl0bGU+XG4gICAgXHQgICAgICAgICAgICA8c3R5bGU+XG4gICAgXHQgICAgICAgICAgICAgICAgYm9keSB7XG4gICAgXHQgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICBcdCAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgPC9zdHlsZT5cbiAgICBcdCAgICAgICAgPC9oZWFkPlxuICAgIFx0ICAgICAgICA8Ym9keT5cbiAgICBcdCAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSBJTVBPUlRBTlQhIEFjY291bnQgRGVsZXRpb24gUHJvY2VzcyBTdGFydGVkPC9oMT5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5XZSBoYXZlIHJlY2VpdmVkIGEgcmVxdWVzdCB0byBkZWxldGUgeW91ciBHdWVzdGJvb2sgYWNjb3VudC4gVGhpcyBwcm9jZXNzIHdpbGwgcGVybWFuZW50bHkgcmVtb3ZlIHlvdXIgYWNjb3VudCBhbmQgYWxsIGFzc29jaWF0ZWQgZGF0YSBmcm9tIG91ciBzeXN0ZW0uPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCBpbml0aWF0ZSB0aGlzIHJlcXVlc3QsIHBsZWFzZSBjb250YWN0IHVzIGltbWVkaWF0ZWx5IHRvIHN0b3AgdGhlIGRlbGV0aW9uIHByb2Nlc3MuIFlvdSBjYW4gcmVhY2ggdXMgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPi48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPk9uY2UgdGhlIGRlbGV0aW9uIHByb2Nlc3MgaXMgY29tcGxldGUsIHlvdSB3aWxsIHJlY2VpdmUgYW5vdGhlciBlbWFpbCBjb25maXJtaW5nIHRoYXQgeW91ciBhY2NvdW50IGhhcyBiZWVuIGRlbGV0ZWQuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+JmNvcHk7ICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBHdWVzdGJvb2suIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgIDwvYm9keT5cbiAgICBcdCAgICA8L2h0bWw+XG4gICAgXHRgO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yIH0pO1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdGBGYWlsZWQgdG8gZ2VuZXJhdGUgYWNjb3VudCBkZWxldGlvbiBzdGFydGVkIGVtYWlsIHRlbXBsYXRlOiAke1xuXHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdH1gXG5cdFx0KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRpb25TdGFydGVkRW1haWxUZW1wbGF0ZTtcbiJdfQ==

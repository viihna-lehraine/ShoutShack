import { ServiceFactory } from '../index/factory/ServiceFactory.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
const logger = await ServiceFactory.getLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
const generateAccountDeletedConfirmationEmailTemplate = username => {
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
			`Failed to generate account deleted confirmation email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generateAccountDeletedConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0ZWRDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RlbXBsYXRlcy9hY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRXhELE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDdkQsTUFBTSxZQUFZLEdBQUcsTUFBTSxjQUFjLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUVuRSxNQUFNLCtDQUErQyxHQUFHLENBQ3ZELFFBQWdCLEVBQ1AsRUFBRTtJQUNYLG9CQUFvQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRXpFLElBQUksQ0FBQztRQUNKLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0FnRDRCLFFBQVE7Ozs7OztxQ0FNUixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTs7Ozs7TUFLdkQsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2QsbUVBQ0MsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDdEQsRUFBRSxDQUNGLENBQUM7SUFDSCxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBRUYsZUFBZSwrQ0FBK0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9TZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuXG5jb25zdCBsb2dnZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5jb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cbmNvbnN0IGdlbmVyYXRlQWNjb3VudERlbGV0ZWRDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlID0gKFxuXHR1c2VybmFtZTogc3RyaW5nXG4pOiBzdHJpbmcgPT4ge1xuXHR2YWxpZGF0ZURlcGVuZGVuY2llcyhbeyBuYW1lOiAndXNlcm5hbWUnLCBpbnN0YW5jZTogdXNlcm5hbWUgfV0sIGxvZ2dlcik7XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gYFxuICAgIFx0ICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIFx0ICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgIFx0ICAgICAgICA8aGVhZD5cbiAgICBcdCAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIFx0ICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIFlvdXIgQWNjb3VudCBIYXMgQmVlbiBEZWxldGVkPC90aXRsZT5cbiAgICBcdCAgICAgICAgICAgIDxzdHlsZT5cbiAgICBcdCAgICAgICAgICAgICAgICBib2R5IHtcbiAgICBcdCAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICBcdCAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgIFx0ICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICA8L3N0eWxlPlxuICAgIFx0ICAgICAgICA8L2hlYWQ+XG4gICAgXHQgICAgICAgIDxib2R5PlxuICAgIFx0ICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIFlvdXIgQWNjb3VudCBIYXMgQmVlbiBEZWxldGVkPC9oMT5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5XZSB3YW50ZWQgdG8gbGV0IHlvdSBrbm93IHRoYXQgeW91ciBHdWVzdGJvb2sgYWNjb3VudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZGVsZXRlZC4gQWxsIHlvdXIgZGF0YSBoYXMgYmVlbiBwZXJtYW5lbnRseSByZW1vdmVkIGZyb20gb3VyIHN5c3RlbXMuPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgaGF2ZSBhbnkgcXVlc3Rpb25zIG9yIGJlbGlldmUgdGhpcyB3YXMgYSBtaXN0YWtlLCBwbGVhc2UgZG8gbm90IGhlc2l0YXRlIHRvIHJlYWNoIG91dCB0byB1cyBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+LjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+VGhhbmsgeW91IGZvciBiZWluZyBhIHBhcnQgb2Ygb3VyIGNvbW11bml0eS48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD4mY29weTsgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IEd1ZXN0Ym9vay4gQWxsIHJpZ2h0cyByZXNlcnZlZC48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgPC9ib2R5PlxuICAgIFx0ICAgIDwvaHRtbD5cbiAgICBcdGA7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0ZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3IgfSk7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSBhY2NvdW50IGRlbGV0ZWQgY29uZmlybWF0aW9uIGVtYWlsIHRlbXBsYXRlOiAke1xuXHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdH1gXG5cdFx0KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGU7XG4iXX0=

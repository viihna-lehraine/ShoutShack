import { processError } from '../utils/processError.mjs';
import { validateDependencies } from '../utils/validateDependencies.mjs';
const generateAccountDeletionStartedEmailTemplate = (username, logger) => {
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
			`Failed to generate account deletion started email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generateAccountDeletionStartedEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGVzL2FjY291bnREZWxldGlvblN0YXJ0ZWRFbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUVyRSxNQUFNLDJDQUEyQyxHQUFHLENBQ25ELFFBQWdCLEVBQ2hCLE1BQWMsRUFDTCxFQUFFO0lBQ1gsb0JBQW9CLENBQ25CO1FBQ0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7UUFDeEMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7S0FDcEMsRUFDRCxNQUFNLENBQ04sQ0FBQztJQUVGLElBQUksQ0FBQztRQUNKLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQTJENEIsUUFBUTs7Ozs7O3FDQU1SLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFOzs7OztNQUt2RCxDQUFDO0lBQ04sQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDaEIsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM1QixNQUFNLElBQUksS0FBSyxDQUNkLCtEQUNDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ3RELEVBQUUsQ0FDRixDQUFDO0lBQ0gsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLGVBQWUsMkNBQTJDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IHByb2Nlc3NFcnJvciB9IGZyb20gJy4uL3V0aWxzL3Byb2Nlc3NFcnJvcic7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcblxuY29uc3QgZ2VuZXJhdGVBY2NvdW50RGVsZXRpb25TdGFydGVkRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0bG9nZ2VyOiBMb2dnZXJcbik6IHN0cmluZyA9PiB7XG5cdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFtcblx0XHRcdHsgbmFtZTogJ3VzZXJuYW1lJywgaW5zdGFuY2U6IHVzZXJuYW1lIH0sXG5cdFx0XHR7IG5hbWU6ICdsb2dnZXInLCBpbnN0YW5jZTogbG9nZ2VyIH1cblx0XHRdLFxuXHRcdGxvZ2dlclxuXHQpO1xuXG5cdHRyeSB7XG5cdFx0cmV0dXJuIGBcbiAgICBcdCAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICBcdCAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICBcdCAgICAgICAgPGhlYWQ+XG4gICAgXHQgICAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICBcdCAgICAgICAgICAgIDx0aXRsZT5HdWVzdGJvb2sgLSBJTVBPUlRBTlQhIEFjY291bnQgRGVsZXRpb24gUHJvY2VzcyBTdGFydGVkPC90aXRsZT5cbiAgICBcdCAgICAgICAgICAgIDxzdHlsZT5cbiAgICBcdCAgICAgICAgICAgICAgICBib2R5IHtcbiAgICBcdCAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgXHQgICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICBcdCAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgIFx0ICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICA8L3N0eWxlPlxuICAgIFx0ICAgICAgICA8L2hlYWQ+XG4gICAgXHQgICAgICAgIDxib2R5PlxuICAgIFx0ICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIElNUE9SVEFOVCEgQWNjb3VudCBEZWxldGlvbiBQcm9jZXNzIFN0YXJ0ZWQ8L2gxPlxuICAgIFx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPldlIGhhdmUgcmVjZWl2ZWQgYSByZXF1ZXN0IHRvIGRlbGV0ZSB5b3VyIEd1ZXN0Ym9vayBhY2NvdW50LiBUaGlzIHByb2Nlc3Mgd2lsbCBwZXJtYW5lbnRseSByZW1vdmUgeW91ciBhY2NvdW50IGFuZCBhbGwgYXNzb2NpYXRlZCBkYXRhIGZyb20gb3VyIHN5c3RlbS48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IGluaXRpYXRlIHRoaXMgcmVxdWVzdCwgcGxlYXNlIGNvbnRhY3QgdXMgaW1tZWRpYXRlbHkgdG8gc3RvcCB0aGUgZGVsZXRpb24gcHJvY2Vzcy4gWW91IGNhbiByZWFjaCB1cyBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+LjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICAgICAgPHA+T25jZSB0aGUgZGVsZXRpb24gcHJvY2VzcyBpcyBjb21wbGV0ZSwgeW91IHdpbGwgcmVjZWl2ZSBhbm90aGVyIGVtYWlsIGNvbmZpcm1pbmcgdGhhdCB5b3VyIGFjY291bnQgaGFzIGJlZW4gZGVsZXRlZC48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD4mY29weTsgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IEd1ZXN0Ym9vay4gQWxsIHJpZ2h0cyByZXNlcnZlZC48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgXHQgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgPC9ib2R5PlxuICAgIFx0ICAgIDwvaHRtbD5cbiAgICBcdGA7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBsb2dnZXIpO1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdGBGYWlsZWQgdG8gZ2VuZXJhdGUgYWNjb3VudCBkZWxldGlvbiBzdGFydGVkIGVtYWlsIHRlbXBsYXRlOiAke1xuXHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdH1gXG5cdFx0KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRpb25TdGFydGVkRW1haWxUZW1wbGF0ZTtcbiJdfQ==

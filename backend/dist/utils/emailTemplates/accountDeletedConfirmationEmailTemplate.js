const generateAccountDeletedConfirmationEmailTemplate = username => {
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
};
export default generateAccountDeletedConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0ZWRDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2VtYWlsVGVtcGxhdGVzL2FjY291bnREZWxldGVkQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLCtDQUErQyxHQUFHLENBQ3ZELFFBQWdCLEVBQ1AsRUFBRTtJQUNYLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0FnRDRCLFFBQVE7Ozs7OztvQ0FNUixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTs7Ozs7S0FLdkQsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLGVBQWUsK0NBQStDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnZW5lcmF0ZUFjY291bnREZWxldGVkQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZ1xuKTogc3RyaW5nID0+IHtcblx0cmV0dXJuIGBcbiAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIFlvdXIgQWNjb3VudCBIYXMgQmVlbiBEZWxldGVkPC90aXRsZT5cbiAgICAgICAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICAgICAgICAgIGJvZHkge1xuICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGVudCBwIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSBZb3VyIEFjY291bnQgSGFzIEJlZW4gRGVsZXRlZDwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPldlIHdhbnRlZCB0byBsZXQgeW91IGtub3cgdGhhdCB5b3VyIEd1ZXN0Ym9vayBhY2NvdW50IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBkZWxldGVkLiBBbGwgeW91ciBkYXRhIGhhcyBiZWVuIHBlcm1hbmVudGx5IHJlbW92ZWQgZnJvbSBvdXIgc3lzdGVtcy48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgaGF2ZSBhbnkgcXVlc3Rpb25zIG9yIGJlbGlldmUgdGhpcyB3YXMgYSBtaXN0YWtlLCBwbGVhc2UgZG8gbm90IGhlc2l0YXRlIHRvIHJlYWNoIG91dCB0byB1cyBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+LjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPlRoYW5rIHlvdSBmb3IgYmVpbmcgYSBwYXJ0IG9mIG91ciBjb21tdW5pdHkuPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+JmNvcHk7ICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBHdWVzdGJvb2suIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvYm9keT5cbiAgICAgICAgPC9odG1sPlxuICAgIGA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBnZW5lcmF0ZUFjY291bnREZWxldGVkQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZTtcbiJdfQ==

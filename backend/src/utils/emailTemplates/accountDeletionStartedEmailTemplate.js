const generateAccountDeletionStartedEmailTemplate = (username) => {
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
};
export default generateAccountDeletionStartedEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy91dGlscy9lbWFpbFRlbXBsYXRlcy9hY2NvdW50RGVsZXRpb25TdGFydGVkRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLDJDQUEyQyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFO0lBQ3hFLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQTJENEIsUUFBUTs7Ozs7O29DQU1SLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFOzs7OztLQUt2RCxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBRUYsZUFBZSwyQ0FBMkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdlbmVyYXRlQWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUgPSAodXNlcm5hbWU6IHN0cmluZykgPT4ge1xuXHRyZXR1cm4gYFxuICAgICAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICAgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgICAgICAgICA8aGVhZD5cbiAgICAgICAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICAgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gSU1QT1JUQU5UISBBY2NvdW50IERlbGV0aW9uIFByb2Nlc3MgU3RhcnRlZDwvdGl0bGU+XG4gICAgICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSBJTVBPUlRBTlQhIEFjY291bnQgRGVsZXRpb24gUHJvY2VzcyBTdGFydGVkPC9oMT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+V2UgaGF2ZSByZWNlaXZlZCBhIHJlcXVlc3QgdG8gZGVsZXRlIHlvdXIgR3Vlc3Rib29rIGFjY291bnQuIFRoaXMgcHJvY2VzcyB3aWxsIHBlcm1hbmVudGx5IHJlbW92ZSB5b3VyIGFjY291bnQgYW5kIGFsbCBhc3NvY2lhdGVkIGRhdGEgZnJvbSBvdXIgc3lzdGVtLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IGluaXRpYXRlIHRoaXMgcmVxdWVzdCwgcGxlYXNlIGNvbnRhY3QgdXMgaW1tZWRpYXRlbHkgdG8gc3RvcCB0aGUgZGVsZXRpb24gcHJvY2Vzcy4gWW91IGNhbiByZWFjaCB1cyBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+LjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPk9uY2UgdGhlIGRlbGV0aW9uIHByb2Nlc3MgaXMgY29tcGxldGUsIHlvdSB3aWxsIHJlY2VpdmUgYW5vdGhlciBlbWFpbCBjb25maXJtaW5nIHRoYXQgeW91ciBhY2NvdW50IGhhcyBiZWVuIGRlbGV0ZWQuPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+JmNvcHk7ICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBHdWVzdGJvb2suIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvYm9keT5cbiAgICAgICAgPC9odG1sPlxuICAgIGA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBnZW5lcmF0ZUFjY291bnREZWxldGlvblN0YXJ0ZWRFbWFpbFRlbXBsYXRlO1xuIl19

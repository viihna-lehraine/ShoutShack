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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZW1haWxUZW1wbGF0ZXMvYWNjb3VudERlbGV0aW9uU3RhcnRlZEVtYWlsVGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSwyQ0FBMkMsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtJQUN4RSxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0EyRDRCLFFBQVE7Ozs7OztvQ0FNUixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTs7Ozs7S0FLdkQsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLGVBQWUsMkNBQTJDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnZW5lcmF0ZUFjY291bnREZWxldGlvblN0YXJ0ZWRFbWFpbFRlbXBsYXRlID0gKHVzZXJuYW1lOiBzdHJpbmcpID0+IHtcblx0cmV0dXJuIGBcbiAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIElNUE9SVEFOVCEgQWNjb3VudCBEZWxldGlvbiBQcm9jZXNzIFN0YXJ0ZWQ8L3RpdGxlPlxuICAgICAgICAgICAgICAgIDxzdHlsZT5cbiAgICAgICAgICAgICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICAgICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA8L3N0eWxlPlxuICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgPGJvZHk+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gSU1QT1JUQU5UISBBY2NvdW50IERlbGV0aW9uIFByb2Nlc3MgU3RhcnRlZDwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPldlIGhhdmUgcmVjZWl2ZWQgYSByZXF1ZXN0IHRvIGRlbGV0ZSB5b3VyIEd1ZXN0Ym9vayBhY2NvdW50LiBUaGlzIHByb2Nlc3Mgd2lsbCBwZXJtYW5lbnRseSByZW1vdmUgeW91ciBhY2NvdW50IGFuZCBhbGwgYXNzb2NpYXRlZCBkYXRhIGZyb20gb3VyIHN5c3RlbS48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCBpbml0aWF0ZSB0aGlzIHJlcXVlc3QsIHBsZWFzZSBjb250YWN0IHVzIGltbWVkaWF0ZWx5IHRvIHN0b3AgdGhlIGRlbGV0aW9uIHByb2Nlc3MuIFlvdSBjYW4gcmVhY2ggdXMgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPi48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5PbmNlIHRoZSBkZWxldGlvbiBwcm9jZXNzIGlzIGNvbXBsZXRlLCB5b3Ugd2lsbCByZWNlaXZlIGFub3RoZXIgZW1haWwgY29uZmlybWluZyB0aGF0IHlvdXIgYWNjb3VudCBoYXMgYmVlbiBkZWxldGVkLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gR3Vlc3Rib29rLiBBbGwgcmlnaHRzIHJlc2VydmVkLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2JvZHk+XG4gICAgICAgIDwvaHRtbD5cbiAgICBgO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRpb25TdGFydGVkRW1haWxUZW1wbGF0ZTtcbiJdfQ==

const generateAccountDeletedConfirmationEmailTemplate = (username) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0ZWRDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2VtYWlsVGVtcGxhdGVzL2FjY291bnREZWxldGVkQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLCtDQUErQyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFO0lBQzVFLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0FnRDRCLFFBQVE7Ozs7OztvQ0FNUixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTs7Ozs7S0FLdkQsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLGVBQWUsK0NBQStDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnZW5lcmF0ZUFjY291bnREZWxldGVkQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9ICh1c2VybmFtZTogc3RyaW5nKSA9PiB7XG5cdHJldHVybiBgXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgICAgICAgICAgIDx0aXRsZT5HdWVzdGJvb2sgLSBZb3VyIEFjY291bnQgSGFzIEJlZW4gRGVsZXRlZDwvdGl0bGU+XG4gICAgICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA8L3N0eWxlPlxuICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgPGJvZHk+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gWW91ciBBY2NvdW50IEhhcyBCZWVuIERlbGV0ZWQ8L2gxPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5XZSB3YW50ZWQgdG8gbGV0IHlvdSBrbm93IHRoYXQgeW91ciBHdWVzdGJvb2sgYWNjb3VudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZGVsZXRlZC4gQWxsIHlvdXIgZGF0YSBoYXMgYmVlbiBwZXJtYW5lbnRseSByZW1vdmVkIGZyb20gb3VyIHN5c3RlbXMuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGhhdmUgYW55IHF1ZXN0aW9ucyBvciBiZWxpZXZlIHRoaXMgd2FzIGEgbWlzdGFrZSwgcGxlYXNlIGRvIG5vdCBoZXNpdGF0ZSB0byByZWFjaCBvdXQgdG8gdXMgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPi48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5UaGFuayB5b3UgZm9yIGJlaW5nIGEgcGFydCBvZiBvdXIgY29tbXVuaXR5LjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gR3Vlc3Rib29rLiBBbGwgcmlnaHRzIHJlc2VydmVkLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2JvZHk+XG4gICAgICAgIDwvaHRtbD5cbiAgICBgO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGU7XG4iXX0=

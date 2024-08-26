const generateConfirmationEmailTemplate = (username, confirmationUrl) => {
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
                        <h1>Guestbook - Account Confirmation</h1>
                    </div>
                    <div class="content">
                        <p>Hello, ${username},</p>
                        <p>Thank you for registering your account at guestbook.com! I'm so glad you've chosen to join our community.</p>
                        <p>Please click the button below or copy and paste the link into your browser to confirm your account, and your account will be fully registered.</p>
                        <a href="${confirmationUrl}" class="button">Confirm Email</a>
                        <p>${confirmationUrl}</p>
                    </div>
                    <div class="footer">
                        <p>If you did not register for an account at guestbook.com, please ignore this email.</p>
                        <p>If you experience any issues registering your account, please send an email to me at <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a> and I'll respond to you as soon as possible.</p>
                        <p>Have a great day! :)</p>
                    </div>
                </div>
            </body>
        </html>
    `;
};
export default generateConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9lbWFpbFRlbXBsYXRlcy9jb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0saUNBQWlDLEdBQUcsQ0FDekMsUUFBZ0IsRUFDaEIsZUFBdUIsRUFDZCxFQUFFO0lBQ1gsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0NBMkQ0QixRQUFROzs7bUNBR1QsZUFBZTs2QkFDckIsZUFBZTs7Ozs7Ozs7OztLQVV2QyxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBRUYsZUFBZSxpQ0FBaUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdlbmVyYXRlQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0Y29uZmlybWF0aW9uVXJsOiBzdHJpbmdcbik6IHN0cmluZyA9PiB7XG5cdHJldHVybiBgXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgICAgICAgICAgIDx0aXRsZT5HdWVzdGJvb2sgLSBBY2NvdW50IENvbmZpcm1hdGlvbjwvdGl0bGU+XG4gICAgICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuaGVhZGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA8L3N0eWxlPlxuICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgPGJvZHk+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gQWNjb3VudCBDb25maXJtYXRpb248L2gxPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5UaGFuayB5b3UgZm9yIHJlZ2lzdGVyaW5nIHlvdXIgYWNjb3VudCBhdCBndWVzdGJvb2suY29tISBJJ20gc28gZ2xhZCB5b3UndmUgY2hvc2VuIHRvIGpvaW4gb3VyIGNvbW11bml0eS48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyBvciBjb3B5IGFuZCBwYXN0ZSB0aGUgbGluayBpbnRvIHlvdXIgYnJvd3NlciB0byBjb25maXJtIHlvdXIgYWNjb3VudCwgYW5kIHlvdXIgYWNjb3VudCB3aWxsIGJlIGZ1bGx5IHJlZ2lzdGVyZWQuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7Y29uZmlybWF0aW9uVXJsfVwiIGNsYXNzPVwiYnV0dG9uXCI+Q29uZmlybSBFbWFpbDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPiR7Y29uZmlybWF0aW9uVXJsfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IHJlZ2lzdGVyIGZvciBhbiBhY2NvdW50IGF0IGd1ZXN0Ym9vay5jb20sIHBsZWFzZSBpZ25vcmUgdGhpcyBlbWFpbC48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZXhwZXJpZW5jZSBhbnkgaXNzdWVzIHJlZ2lzdGVyaW5nIHlvdXIgYWNjb3VudCwgcGxlYXNlIHNlbmQgYW4gZW1haWwgdG8gbWUgYXQgPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSdsbCByZXNwb25kIHRvIHlvdSBhcyBzb29uIGFzIHBvc3NpYmxlLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPkhhdmUgYSBncmVhdCBkYXkhIDopPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvYm9keT5cbiAgICAgICAgPC9odG1sPlxuICAgIGA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBnZW5lcmF0ZUNvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGU7XG4iXX0=

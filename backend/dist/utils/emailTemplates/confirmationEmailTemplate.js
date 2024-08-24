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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9lbWFpbFRlbXBsYXRlcy9jb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0saUNBQWlDLEdBQUcsQ0FDekMsUUFBZ0IsRUFDaEIsZUFBdUIsRUFDdEIsRUFBRTtJQUNILE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQTJENEIsUUFBUTs7O21DQUdULGVBQWU7NkJBQ3JCLGVBQWU7Ozs7Ozs7Ozs7S0FVdkMsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLGVBQWUsaUNBQWlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnZW5lcmF0ZUNvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGUgPSAoXG5cdHVzZXJuYW1lOiBzdHJpbmcsXG5cdGNvbmZpcm1hdGlvblVybDogc3RyaW5nXG4pID0+IHtcblx0cmV0dXJuIGBcbiAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIEFjY291bnQgQ29uZmlybWF0aW9uPC90aXRsZT5cbiAgICAgICAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICAgICAgICAgIGJvZHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMT5HdWVzdGJvb2sgLSBBY2NvdW50IENvbmZpcm1hdGlvbjwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPlRoYW5rIHlvdSBmb3IgcmVnaXN0ZXJpbmcgeW91ciBhY2NvdW50IGF0IGd1ZXN0Ym9vay5jb20hIEknbSBzbyBnbGFkIHlvdSd2ZSBjaG9zZW4gdG8gam9pbiBvdXIgY29tbXVuaXR5LjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPlBsZWFzZSBjbGljayB0aGUgYnV0dG9uIGJlbG93IG9yIGNvcHkgYW5kIHBhc3RlIHRoZSBsaW5rIGludG8geW91ciBicm93c2VyIHRvIGNvbmZpcm0geW91ciBhY2NvdW50LCBhbmQgeW91ciBhY2NvdW50IHdpbGwgYmUgZnVsbHkgcmVnaXN0ZXJlZC48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHtjb25maXJtYXRpb25Vcmx9XCIgY2xhc3M9XCJidXR0b25cIj5Db25maXJtIEVtYWlsPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+JHtjb25maXJtYXRpb25Vcmx9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGRpZCBub3QgcmVnaXN0ZXIgZm9yIGFuIGFjY291bnQgYXQgZ3Vlc3Rib29rLmNvbSwgcGxlYXNlIGlnbm9yZSB0aGlzIGVtYWlsLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBleHBlcmllbmNlIGFueSBpc3N1ZXMgcmVnaXN0ZXJpbmcgeW91ciBhY2NvdW50LCBwbGVhc2Ugc2VuZCBhbiBlbWFpbCB0byBtZSBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+YWRtaW5AdmlpaG5hdGVjaC5jb208L2E+IGFuZCBJJ2xsIHJlc3BvbmQgdG8geW91IGFzIHNvb24gYXMgcG9zc2libGUuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SGF2ZSBhIGdyZWF0IGRheSEgOik8L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9ib2R5PlxuICAgICAgICA8L2h0bWw+XG4gICAgYDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGdlbmVyYXRlQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZTtcbiJdfQ==

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3RzL3V0aWxzL2VtYWlsVGVtcGxhdGVzL2NvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxpQ0FBaUMsR0FBRyxDQUN6QyxRQUFnQixFQUNoQixlQUF1QixFQUN0QixFQUFFO0lBQ0gsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0NBMkQ0QixRQUFROzs7bUNBR1QsZUFBZTs2QkFDckIsZUFBZTs7Ozs7Ozs7OztLQVV2QyxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBRUYsZUFBZSxpQ0FBaUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdlbmVyYXRlQ29uZmlybWF0aW9uRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0Y29uZmlybWF0aW9uVXJsOiBzdHJpbmdcbikgPT4ge1xuXHRyZXR1cm4gYFxuICAgICAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICAgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgICAgICAgICA8aGVhZD5cbiAgICAgICAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICAgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gQWNjb3VudCBDb25maXJtYXRpb248L3RpdGxlPlxuICAgICAgICAgICAgICAgIDxzdHlsZT5cbiAgICAgICAgICAgICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGVudCBwIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuYnV0dG9uIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9zdHlsZT5cbiAgICAgICAgICAgIDwvaGVhZD5cbiAgICAgICAgICAgIDxib2R5PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIEFjY291bnQgQ29uZmlybWF0aW9uPC9oMT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+VGhhbmsgeW91IGZvciByZWdpc3RlcmluZyB5b3VyIGFjY291bnQgYXQgZ3Vlc3Rib29rLmNvbSEgSSdtIHNvIGdsYWQgeW91J3ZlIGNob3NlbiB0byBqb2luIG91ciBjb21tdW5pdHkuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+UGxlYXNlIGNsaWNrIHRoZSBidXR0b24gYmVsb3cgb3IgY29weSBhbmQgcGFzdGUgdGhlIGxpbmsgaW50byB5b3VyIGJyb3dzZXIgdG8gY29uZmlybSB5b3VyIGFjY291bnQsIGFuZCB5b3VyIGFjY291bnQgd2lsbCBiZSBmdWxseSByZWdpc3RlcmVkLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIke2NvbmZpcm1hdGlvblVybH1cIiBjbGFzcz1cImJ1dHRvblwiPkNvbmZpcm0gRW1haWw8L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD4ke2NvbmZpcm1hdGlvblVybH08L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCByZWdpc3RlciBmb3IgYW4gYWNjb3VudCBhdCBndWVzdGJvb2suY29tLCBwbGVhc2UgaWdub3JlIHRoaXMgZW1haWwuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+SWYgeW91IGV4cGVyaWVuY2UgYW55IGlzc3VlcyByZWdpc3RlcmluZyB5b3VyIGFjY291bnQsIHBsZWFzZSBzZW5kIGFuIGVtYWlsIHRvIG1lIGF0IDxhIGhyZWY9XCJtYWlsdG86YWRtaW5AdmlpaG5hdGVjaC5jb21cIj5hZG1pbkB2aWlobmF0ZWNoLmNvbTwvYT4gYW5kIEknbGwgcmVzcG9uZCB0byB5b3UgYXMgc29vbiBhcyBwb3NzaWJsZS48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5IYXZlIGEgZ3JlYXQgZGF5ISA6KTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2JvZHk+XG4gICAgICAgIDwvaHRtbD5cbiAgICBgO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlO1xuIl19

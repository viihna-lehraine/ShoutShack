const generate2FAEnabledEmailTemplate = (username) => {
	return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Guestbook - 2 Factor Authentication Enabled</title>
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
                        <h1>Guestbook - 2 Factor Authentication Enabled</h1>
                    </div>
                    <div class="content">
                        <p>Hello, ${username},</p>
                        <p>Two-factor authentication has been enabled for your <a href="URL">Guestbook</a> account. If you did not perform this action, your account may be compromised. In that event, please reach out to me directly at <a href="mailto:admin@viihnatech.com">viihna@viihnatech.com</a> and I will investigate this as soon as possible.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
};
export default generate2FAEnabledEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMkZBRW5hYmxlZEVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy91dGlscy9lbWFpbFRlbXBsYXRlcy8yRkFFbmFibGVkRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLCtCQUErQixHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFO0lBQzVELE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQTJENEIsUUFBUTs7Ozs7O0tBTXZDLENBQUM7QUFDTixDQUFDLENBQUM7QUFFRixlQUFlLCtCQUErQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ2VuZXJhdGUyRkFFbmFibGVkRW1haWxUZW1wbGF0ZSA9ICh1c2VybmFtZTogc3RyaW5nKSA9PiB7XG5cdHJldHVybiBgXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgICAgICAgICAgIDx0aXRsZT5HdWVzdGJvb2sgLSAyIEZhY3RvciBBdXRoZW50aWNhdGlvbiBFbmFibGVkPC90aXRsZT5cbiAgICAgICAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICAgICAgICAgIGJvZHkge1xuICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLmNvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuY29udGVudCBwIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAuYnV0dG9uIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9zdHlsZT5cbiAgICAgICAgICAgIDwvaGVhZD5cbiAgICAgICAgICAgIDxib2R5PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIDIgRmFjdG9yIEF1dGhlbnRpY2F0aW9uIEVuYWJsZWQ8L2gxPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5Ud28tZmFjdG9yIGF1dGhlbnRpY2F0aW9uIGhhcyBiZWVuIGVuYWJsZWQgZm9yIHlvdXIgPGEgaHJlZj1cIlVSTFwiPkd1ZXN0Ym9vazwvYT4gYWNjb3VudC4gSWYgeW91IGRpZCBub3QgcGVyZm9ybSB0aGlzIGFjdGlvbiwgeW91ciBhY2NvdW50IG1heSBiZSBjb21wcm9taXNlZC4gSW4gdGhhdCBldmVudCwgcGxlYXNlIHJlYWNoIG91dCB0byBtZSBkaXJlY3RseSBhdCA8YSBocmVmPVwibWFpbHRvOmFkbWluQHZpaWhuYXRlY2guY29tXCI+dmlpaG5hQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSB3aWxsIGludmVzdGlnYXRlIHRoaXMgYXMgc29vbiBhcyBwb3NzaWJsZS48L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9ib2R5PlxuICAgICAgICA8L2h0bWw+XG4gICAgYDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGdlbmVyYXRlMkZBRW5hYmxlZEVtYWlsVGVtcGxhdGU7XG4iXX0=

const generate2FactorEmailTemplate = (username, emailVerificationCode) => {
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
                      <h1>Guestbook - Your Login Code</h1>
                  </div>
                  <div class="content">
                      <p>Hello, ${username},</p>
                      <p>Here is the code you requested so that you may log into your account. Please know that this code will be valid for the next 30 minutes. If you are unable to login by then, please request a new code.</p>
                      <h2>${emailVerificationCode}</h2>
                  </div>
                  <div class="footer"> <!-- Correctly closing the footer with div for consistency -->
                      <p>If you did not request this code, then someone else may have access to your password and is trying to access your account. If this is the case, please log in and change your password at your earliest convenience.</p>
                      <p>Please feel free to reach out to me by sending an email to <a href="mailto:admin@viihnatech.com">admin@viihnatech.com</a> and I'll respond to you as soon as possible.</p>
                      <p>Have a great day! :)</p>
                  </div>
              </div>
          </body>
      </html>
    `;
};
export default generate2FactorEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMkZhY3RvckVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy91dGlscy9lbWFpbFRlbXBsYXRlcy8yRmFjdG9yRW1haWxUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLDRCQUE0QixHQUFHLENBQ3BDLFFBQWdCLEVBQ2hCLHFCQUE2QixFQUNwQixFQUFFO0lBQ1gsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0NBMkQwQixRQUFROzs0QkFFZCxxQkFBcUI7Ozs7Ozs7Ozs7S0FVNUMsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLGVBQWUsNEJBQTRCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnZW5lcmF0ZTJGYWN0b3JFbWFpbFRlbXBsYXRlID0gKFxuXHR1c2VybmFtZTogc3RyaW5nLFxuXHRlbWFpbFZlcmlmaWNhdGlvbkNvZGU6IHN0cmluZ1xuKTogc3RyaW5nID0+IHtcblx0cmV0dXJuIGBcbiAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gQWNjb3VudCBDb25maXJtYXRpb248L3RpdGxlPlxuICAgICAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRjRGNEY0O1xuICAgICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCAwIDA7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLmNvbnRlbnQgcCB7XG4gICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLmJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMjBweCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjRkZGRkZGO1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5mb290ZXIge1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4ODtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgPC9zdHlsZT5cbiAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgPGJvZHk+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gWW91ciBMb2dpbiBDb2RlPC9oMT5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8cD5IZWxsbywgJHt1c2VybmFtZX0sPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwPkhlcmUgaXMgdGhlIGNvZGUgeW91IHJlcXVlc3RlZCBzbyB0aGF0IHlvdSBtYXkgbG9nIGludG8geW91ciBhY2NvdW50LiBQbGVhc2Uga25vdyB0aGF0IHRoaXMgY29kZSB3aWxsIGJlIHZhbGlkIGZvciB0aGUgbmV4dCAzMCBtaW51dGVzLiBJZiB5b3UgYXJlIHVuYWJsZSB0byBsb2dpbiBieSB0aGVuLCBwbGVhc2UgcmVxdWVzdCBhIG5ldyBjb2RlLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8aDI+JHtlbWFpbFZlcmlmaWNhdGlvbkNvZGV9PC9oMj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPiA8IS0tIENvcnJlY3RseSBjbG9zaW5nIHRoZSBmb290ZXIgd2l0aCBkaXYgZm9yIGNvbnNpc3RlbmN5IC0tPlxuICAgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBkaWQgbm90IHJlcXVlc3QgdGhpcyBjb2RlLCB0aGVuIHNvbWVvbmUgZWxzZSBtYXkgaGF2ZSBhY2Nlc3MgdG8geW91ciBwYXNzd29yZCBhbmQgaXMgdHJ5aW5nIHRvIGFjY2VzcyB5b3VyIGFjY291bnQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHBsZWFzZSBsb2cgaW4gYW5kIGNoYW5nZSB5b3VyIHBhc3N3b3JkIGF0IHlvdXIgZWFybGllc3QgY29udmVuaWVuY2UuPC9wPlxuICAgICAgICAgICAgICAgICAgICAgIDxwPlBsZWFzZSBmZWVsIGZyZWUgdG8gcmVhY2ggb3V0IHRvIG1lIGJ5IHNlbmRpbmcgYW4gZW1haWwgdG8gPGEgaHJlZj1cIm1haWx0bzphZG1pbkB2aWlobmF0ZWNoLmNvbVwiPmFkbWluQHZpaWhuYXRlY2guY29tPC9hPiBhbmQgSSdsbCByZXNwb25kIHRvIHlvdSBhcyBzb29uIGFzIHBvc3NpYmxlLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cD5IYXZlIGEgZ3JlYXQgZGF5ISA6KTwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2JvZHk+XG4gICAgICA8L2h0bWw+XG4gICAgYDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGdlbmVyYXRlMkZhY3RvckVtYWlsVGVtcGxhdGU7XG4iXX0=

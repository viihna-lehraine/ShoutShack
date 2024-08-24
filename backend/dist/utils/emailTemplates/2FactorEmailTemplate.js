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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMkZhY3RvckVtYWlsVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZW1haWxUZW1wbGF0ZXMvMkZhY3RvckVtYWlsVGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSw0QkFBNEIsR0FBRyxDQUNwQyxRQUFnQixFQUNoQixxQkFBNkIsRUFDcEIsRUFBRTtJQUNYLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQTJEMEIsUUFBUTs7NEJBRWQscUJBQXFCOzs7Ozs7Ozs7O0tBVTVDLENBQUM7QUFDTixDQUFDLENBQUM7QUFFRixlQUFlLDRCQUE0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ2VuZXJhdGUyRmFjdG9yRW1haWxUZW1wbGF0ZSA9IChcblx0dXNlcm5hbWU6IHN0cmluZyxcblx0ZW1haWxWZXJpZmljYXRpb25Db2RlOiBzdHJpbmdcbik6IHN0cmluZyA9PiB7XG5cdHJldHVybiBgXG4gICAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICAgICAgICAgICAgPHRpdGxlPkd1ZXN0Ym9vayAtIEFjY291bnQgQ29uZmlybWF0aW9uPC90aXRsZT5cbiAgICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Y0RjRGNDtcbiAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdCRkY7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNGRkZGRkY7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAuY29udGVudCB7XG4gICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5jb250ZW50IHAge1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC5idXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDIwcHggYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN0JGRjtcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4ODg4ODg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgIDxib2R5PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGgxPkd1ZXN0Ym9vayAtIFlvdXIgTG9naW4gQ29kZTwvaDE+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHA+SGVsbG8sICR7dXNlcm5hbWV9LDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cD5IZXJlIGlzIHRoZSBjb2RlIHlvdSByZXF1ZXN0ZWQgc28gdGhhdCB5b3UgbWF5IGxvZyBpbnRvIHlvdXIgYWNjb3VudC4gUGxlYXNlIGtub3cgdGhhdCB0aGlzIGNvZGUgd2lsbCBiZSB2YWxpZCBmb3IgdGhlIG5leHQgMzAgbWludXRlcy4gSWYgeW91IGFyZSB1bmFibGUgdG8gbG9naW4gYnkgdGhlbiwgcGxlYXNlIHJlcXVlc3QgYSBuZXcgY29kZS48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPGgyPiR7ZW1haWxWZXJpZmljYXRpb25Db2RlfTwvaDI+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj4gPCEtLSBDb3JyZWN0bHkgY2xvc2luZyB0aGUgZm9vdGVyIHdpdGggZGl2IGZvciBjb25zaXN0ZW5jeSAtLT5cbiAgICAgICAgICAgICAgICAgICAgICA8cD5JZiB5b3UgZGlkIG5vdCByZXF1ZXN0IHRoaXMgY29kZSwgdGhlbiBzb21lb25lIGVsc2UgbWF5IGhhdmUgYWNjZXNzIHRvIHlvdXIgcGFzc3dvcmQgYW5kIGlzIHRyeWluZyB0byBhY2Nlc3MgeW91ciBhY2NvdW50LiBJZiB0aGlzIGlzIHRoZSBjYXNlLCBwbGVhc2UgbG9nIGluIGFuZCBjaGFuZ2UgeW91ciBwYXNzd29yZCBhdCB5b3VyIGVhcmxpZXN0IGNvbnZlbmllbmNlLjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgZmVlbCBmcmVlIHRvIHJlYWNoIG91dCB0byBtZSBieSBzZW5kaW5nIGFuIGVtYWlsIHRvIDxhIGhyZWY9XCJtYWlsdG86YWRtaW5AdmlpaG5hdGVjaC5jb21cIj5hZG1pbkB2aWlobmF0ZWNoLmNvbTwvYT4gYW5kIEknbGwgcmVzcG9uZCB0byB5b3UgYXMgc29vbiBhcyBwb3NzaWJsZS48L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPHA+SGF2ZSBhIGdyZWF0IGRheSEgOik8L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9ib2R5PlxuICAgICAgPC9odG1sPlxuICAgIGA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBnZW5lcmF0ZTJGYWN0b3JFbWFpbFRlbXBsYXRlO1xuIl19

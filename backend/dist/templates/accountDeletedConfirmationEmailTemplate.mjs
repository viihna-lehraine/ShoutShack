import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
const generateAccountDeletedConfirmationEmailTemplate = (username, logger) => {
	validateDependencies(
		[
			{ name: 'username', instance: username },
			{ name: 'logger', instance: logger }
		],
		logger
	);
	try {
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
	} catch (error) {
		processError(error, logger);
		throw new Error(
			`Failed to generate account deleted confirmation email template: ${error instanceof Error ? error.message : String(error)}`
		);
	}
};
export default generateAccountDeletedConfirmationEmailTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERlbGV0ZWRDb25maXJtYXRpb25FbWFpbFRlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RlbXBsYXRlcy9hY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDckUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRXJELE1BQU0sK0NBQStDLEdBQUcsQ0FDdkQsUUFBZ0IsRUFDaEIsTUFBYyxFQUNMLEVBQUU7SUFDWCxvQkFBb0IsQ0FDbkI7UUFDQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTtRQUN4QyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRTtLQUNwQyxFQUNELE1BQU0sQ0FDTixDQUFDO0lBRUYsSUFBSSxDQUFDO1FBQ0osT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQWdENEIsUUFBUTs7Ozs7O3FDQU1SLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFOzs7OztNQUt2RCxDQUFDO0lBQ04sQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDaEIsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM1QixNQUFNLElBQUksS0FBSyxDQUNkLG1FQUNDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ3RELEVBQUUsQ0FDRixDQUFDO0lBQ0gsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLGVBQWUsK0NBQStDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IHZhbGlkYXRlRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi4vdXRpbHMvdmFsaWRhdGVEZXBlbmRlbmNpZXMnO1xuaW1wb3J0IHsgcHJvY2Vzc0Vycm9yIH0gZnJvbSAnLi4vdXRpbHMvcHJvY2Vzc0Vycm9yJztcblxuY29uc3QgZ2VuZXJhdGVBY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGUgPSAoXG5cdHVzZXJuYW1lOiBzdHJpbmcsXG5cdGxvZ2dlcjogTG9nZ2VyXG4pOiBzdHJpbmcgPT4ge1xuXHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRbXG5cdFx0XHR7IG5hbWU6ICd1c2VybmFtZScsIGluc3RhbmNlOiB1c2VybmFtZSB9LFxuXHRcdFx0eyBuYW1lOiAnbG9nZ2VyJywgaW5zdGFuY2U6IGxvZ2dlciB9XG5cdFx0XSxcblx0XHRsb2dnZXJcblx0KTtcblxuXHR0cnkge1xuXHRcdHJldHVybiBgXG4gICAgXHQgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgXHQgICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgXHQgICAgICAgIDxoZWFkPlxuICAgIFx0ICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgXHQgICAgICAgICAgICA8dGl0bGU+R3Vlc3Rib29rIC0gWW91ciBBY2NvdW50IEhhcyBCZWVuIERlbGV0ZWQ8L3RpdGxlPlxuICAgIFx0ICAgICAgICAgICAgPHN0eWxlPlxuICAgIFx0ICAgICAgICAgICAgICAgIGJvZHkge1xuICAgIFx0ICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICBcdCAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgIFx0ICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNEY0RjQ7XG4gICAgXHQgICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAyMHB4IGF1dG87XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XG4gICAgXHQgICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgICAgICAgICAgICAgIC5oZWFkZXIge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3QkZGO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBjb2xvcjogI0ZGRkZGRjtcbiAgICBcdCAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgICAgICAgICAgICAgLmNvbnRlbnQge1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuY29udGVudCBwIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgICAgICAuZm9vdGVyIHtcbiAgICBcdCAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIFx0ICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4O1xuICAgIFx0ICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgICAgIDwvc3R5bGU+XG4gICAgXHQgICAgICAgIDwvaGVhZD5cbiAgICBcdCAgICAgICAgPGJvZHk+XG4gICAgXHQgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8aDE+R3Vlc3Rib29rIC0gWW91ciBBY2NvdW50IEhhcyBCZWVuIERlbGV0ZWQ8L2gxPlxuICAgIFx0ICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPkhlbGxvLCAke3VzZXJuYW1lfSw8L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPldlIHdhbnRlZCB0byBsZXQgeW91IGtub3cgdGhhdCB5b3VyIEd1ZXN0Ym9vayBhY2NvdW50IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBkZWxldGVkLiBBbGwgeW91ciBkYXRhIGhhcyBiZWVuIHBlcm1hbmVudGx5IHJlbW92ZWQgZnJvbSBvdXIgc3lzdGVtcy48L3A+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPklmIHlvdSBoYXZlIGFueSBxdWVzdGlvbnMgb3IgYmVsaWV2ZSB0aGlzIHdhcyBhIG1pc3Rha2UsIHBsZWFzZSBkbyBub3QgaGVzaXRhdGUgdG8gcmVhY2ggb3V0IHRvIHVzIGF0IDxhIGhyZWY9XCJtYWlsdG86YWRtaW5AdmlpaG5hdGVjaC5jb21cIj5hZG1pbkB2aWlobmF0ZWNoLmNvbTwvYT4uPC9wPlxuICAgIFx0ICAgICAgICAgICAgICAgICAgICA8cD5UaGFuayB5b3UgZm9yIGJlaW5nIGEgcGFydCBvZiBvdXIgY29tbXVuaXR5LjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgXHQgICAgICAgICAgICAgICAgICAgIDxwPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gR3Vlc3Rib29rLiBBbGwgcmlnaHRzIHJlc2VydmVkLjwvcD5cbiAgICBcdCAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICBcdCAgICAgICAgICAgIDwvZGl2PlxuICAgIFx0ICAgICAgICA8L2JvZHk+XG4gICAgXHQgICAgPC9odG1sPlxuICAgIFx0YDtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyb3IsIGxvZ2dlcik7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSBhY2NvdW50IGRlbGV0ZWQgY29uZmlybWF0aW9uIGVtYWlsIHRlbXBsYXRlOiAke1xuXHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdH1gXG5cdFx0KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZ2VuZXJhdGVBY2NvdW50RGVsZXRlZENvbmZpcm1hdGlvbkVtYWlsVGVtcGxhdGU7XG4iXX0=

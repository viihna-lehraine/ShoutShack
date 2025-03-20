// File: backend/src/common/services/mailer.ts
import nodemailer from 'nodemailer';
import { env } from '../../env/load.js';
const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
    }
});
export async function sendVerificationEmail(email, token) {
    const verificationLink = `https://yourdomain.com/verify?token=${token}`;
    await transporter.sendMail({
        from: '"ShoutShack" <no-reply@shoutshack.com>',
        to: email,
        subject: 'Verify Your ShoutShack Account',
        text: `Yo, confirm your email: ${verificationLink}`,
        html: `<p>Yo, confirm your email:</p><a href="${verificationLink}">Click here to verify</a>`
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZXJ2aWNlcy9tYWlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsOENBQThDO0FBRTlDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFeEMsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQztJQUM5QyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVU7SUFDcEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsWUFBWTtJQUN4QixJQUFJLEVBQUU7UUFDTCxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVU7UUFDcEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxjQUFjO0tBQ3hCO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxLQUFhLEVBQUUsS0FBYTtJQUN2RSxNQUFNLGdCQUFnQixHQUFHLHVDQUF1QyxLQUFLLEVBQUUsQ0FBQztJQUV4RSxNQUFNLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDMUIsSUFBSSxFQUFFLHdDQUF3QztRQUM5QyxFQUFFLEVBQUUsS0FBSztRQUNULE9BQU8sRUFBRSxnQ0FBZ0M7UUFDekMsSUFBSSxFQUFFLDJCQUEyQixnQkFBZ0IsRUFBRTtRQUNuRCxJQUFJLEVBQUUsMENBQTBDLGdCQUFnQiw0QkFBNEI7S0FDNUYsQ0FBQyxDQUFDO0FBQ0osQ0FBQyJ9
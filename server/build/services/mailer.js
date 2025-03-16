// File: server/src/services/mailer.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL21haWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFFdEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUV2QyxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO0lBQzlDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVTtJQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVU7SUFDcEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxZQUFZO0lBQ3hCLElBQUksRUFBRTtRQUNMLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVTtRQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLGNBQWM7S0FDeEI7Q0FDRCxDQUFDLENBQUM7QUFFSCxNQUFNLENBQUMsS0FBSyxVQUFVLHFCQUFxQixDQUFDLEtBQWEsRUFBRSxLQUFhO0lBQ3ZFLE1BQU0sZ0JBQWdCLEdBQUcsdUNBQXVDLEtBQUssRUFBRSxDQUFDO0lBRXhFLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUMxQixJQUFJLEVBQUUsd0NBQXdDO1FBQzlDLEVBQUUsRUFBRSxLQUFLO1FBQ1QsT0FBTyxFQUFFLGdDQUFnQztRQUN6QyxJQUFJLEVBQUUsMkJBQTJCLGdCQUFnQixFQUFFO1FBQ25ELElBQUksRUFBRSwwQ0FBMEMsZ0JBQWdCLDRCQUE0QjtLQUM1RixDQUFDLENBQUM7QUFDSixDQUFDIn0=
// File: backend/src/db/repositories/UserRepository.ts
import { db } from '../main.js';
import { randomBytes } from 'crypto';
export class UserRepository {
    static async createUser(email, hashedPassword) {
        const token = randomBytes(32).toString('hex');
        await db
            .insertInto('users')
            .values({
            email,
            password: hashedPassword,
            verified: false,
            verification_token: token
        })
            .returning(['id'])
            .executeTakeFirstOrThrow();
        return token;
    }
    static async findUserByEmail(email) {
        return db
            .selectFrom('users')
            .select(['id', 'email', 'password'])
            .where('email', '=', email)
            .executeTakeFirst();
    }
    static async verifyUser(token) {
        return db
            .updateTable('users')
            .set({ verified: true, verification_token: null })
            .where('verification_token', '=', token)
            .returning(['id', 'email'])
            .executeTakeFirst();
    }
    static async getUserProfile(userId) {
        return db.selectFrom('users').select(['email']).where('id', '=', userId).executeTakeFirst();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclJlcG9zaXRvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZGIvcmVwb3NpdG9yaWVzL1VzZXJSZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RCxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFFckMsTUFBTSxPQUFPLGNBQWM7SUFDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYSxFQUFFLGNBQXNCO1FBQzVELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFOUMsTUFBTSxFQUFFO2FBQ04sVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUNuQixNQUFNLENBQUM7WUFDUCxLQUFLO1lBQ0wsUUFBUSxFQUFFLGNBQWM7WUFDeEIsUUFBUSxFQUFFLEtBQUs7WUFDZixrQkFBa0IsRUFBRSxLQUFLO1NBQ3pCLENBQUM7YUFDRCxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQix1QkFBdUIsRUFBRSxDQUFDO1FBRTVCLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQWE7UUFDekMsT0FBTyxFQUFFO2FBQ1AsVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUNuQixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ25DLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQzthQUMxQixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFhO1FBQ3BDLE9BQU8sRUFBRTthQUNQLFdBQVcsQ0FBQyxPQUFPLENBQUM7YUFDcEIsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUNqRCxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQzthQUN2QyxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDMUIsZ0JBQWdCLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBYztRQUN6QyxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzdGLENBQUM7Q0FDRCJ9
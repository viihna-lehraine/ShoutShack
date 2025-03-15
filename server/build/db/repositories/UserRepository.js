// File: server/src/db/repositories/UserRepository.ts
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
            .select(['id', 'password'])
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclJlcG9zaXRvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZGIvcmVwb3NpdG9yaWVzL1VzZXJSZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUVyRCxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFFckMsTUFBTSxPQUFPLGNBQWM7SUFDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYSxFQUFFLGNBQXNCO1FBQzVELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFOUMsTUFBTSxFQUFFO2FBQ04sVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUNuQixNQUFNLENBQUM7WUFDUCxLQUFLO1lBQ0wsUUFBUSxFQUFFLGNBQWM7WUFDeEIsUUFBUSxFQUFFLEtBQUs7WUFDZixrQkFBa0IsRUFBRSxLQUFLO1NBQ3pCLENBQUM7YUFDRCxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQix1QkFBdUIsRUFBRSxDQUFDO1FBRTVCLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQWE7UUFDekMsT0FBTyxFQUFFO2FBQ1AsVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUNuQixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDMUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDO2FBQzFCLGdCQUFnQixFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWE7UUFDcEMsT0FBTyxFQUFFO2FBQ1AsV0FBVyxDQUFDLE9BQU8sQ0FBQzthQUNwQixHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDO2FBQ2pELEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDO2FBQ3ZDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzthQUMxQixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFjO1FBQ3pDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDN0YsQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlsZTogc2VydmVyL3NyYy9kYi9yZXBvc2l0b3JpZXMvVXNlclJlcG9zaXRvcnkudHNcblxuaW1wb3J0IHsgZGIgfSBmcm9tICcuLi9tYWluLmpzJztcbmltcG9ydCB7IHJhbmRvbUJ5dGVzIH0gZnJvbSAnY3J5cHRvJztcblxuZXhwb3J0IGNsYXNzIFVzZXJSZXBvc2l0b3J5IHtcblx0c3RhdGljIGFzeW5jIGNyZWF0ZVVzZXIoZW1haWw6IHN0cmluZywgaGFzaGVkUGFzc3dvcmQ6IHN0cmluZykge1xuXHRcdGNvbnN0IHRva2VuID0gcmFuZG9tQnl0ZXMoMzIpLnRvU3RyaW5nKCdoZXgnKTtcblxuXHRcdGF3YWl0IGRiXG5cdFx0XHQuaW5zZXJ0SW50bygndXNlcnMnKVxuXHRcdFx0LnZhbHVlcyh7XG5cdFx0XHRcdGVtYWlsLFxuXHRcdFx0XHRwYXNzd29yZDogaGFzaGVkUGFzc3dvcmQsXG5cdFx0XHRcdHZlcmlmaWVkOiBmYWxzZSxcblx0XHRcdFx0dmVyaWZpY2F0aW9uX3Rva2VuOiB0b2tlblxuXHRcdFx0fSlcblx0XHRcdC5yZXR1cm5pbmcoWydpZCddKVxuXHRcdFx0LmV4ZWN1dGVUYWtlRmlyc3RPclRocm93KCk7XG5cblx0XHRyZXR1cm4gdG9rZW47XG5cdH1cblxuXHRzdGF0aWMgYXN5bmMgZmluZFVzZXJCeUVtYWlsKGVtYWlsOiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gZGJcblx0XHRcdC5zZWxlY3RGcm9tKCd1c2VycycpXG5cdFx0XHQuc2VsZWN0KFsnaWQnLCAncGFzc3dvcmQnXSlcblx0XHRcdC53aGVyZSgnZW1haWwnLCAnPScsIGVtYWlsKVxuXHRcdFx0LmV4ZWN1dGVUYWtlRmlyc3QoKTtcblx0fVxuXG5cdHN0YXRpYyBhc3luYyB2ZXJpZnlVc2VyKHRva2VuOiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gZGJcblx0XHRcdC51cGRhdGVUYWJsZSgndXNlcnMnKVxuXHRcdFx0LnNldCh7IHZlcmlmaWVkOiB0cnVlLCB2ZXJpZmljYXRpb25fdG9rZW46IG51bGwgfSlcblx0XHRcdC53aGVyZSgndmVyaWZpY2F0aW9uX3Rva2VuJywgJz0nLCB0b2tlbilcblx0XHRcdC5yZXR1cm5pbmcoWydpZCcsICdlbWFpbCddKVxuXHRcdFx0LmV4ZWN1dGVUYWtlRmlyc3QoKTtcblx0fVxuXG5cdHN0YXRpYyBhc3luYyBnZXRVc2VyUHJvZmlsZSh1c2VySWQ6IG51bWJlcikge1xuXHRcdHJldHVybiBkYi5zZWxlY3RGcm9tKCd1c2VycycpLnNlbGVjdChbJ2VtYWlsJ10pLndoZXJlKCdpZCcsICc9JywgdXNlcklkKS5leGVjdXRlVGFrZUZpcnN0KCk7XG5cdH1cbn1cbiJdfQ==
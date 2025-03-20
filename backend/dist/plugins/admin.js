// File: backend/src/plugins/admin.ts
import fs from 'fs';
import argon2 from 'argon2';
export async function verifyAdminPassword(password) {
    try {
        const storedData = fs.readFileSync('/etc/shoutshack/admin.pw', 'utf-8').trim();
        const [salt, storedHash] = storedData.split(':');
        return await argon2.verify(storedHash, password + salt);
    }
    catch (error) {
        console.error('Admin password verification error:', error);
        return false;
    }
}
export async function adminAuthMiddleware(request, reply) {
    const session = request.session; // Temporary cast
    if (!session.isAdmin) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGx1Z2lucy9hZG1pbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFHckMsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3BCLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUU1QixNQUFNLENBQUMsS0FBSyxVQUFVLG1CQUFtQixDQUFDLFFBQWdCO0lBQ3pELElBQUksQ0FBQztRQUNKLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsMEJBQTBCLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0UsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRWpELE9BQU8sTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7QUFDRixDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxPQUF1QixFQUFFLEtBQW1CO0lBQ3JGLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUEyQyxDQUFDLENBQUMsaUJBQWlCO0lBRXRGLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEIsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQzFELENBQUM7QUFDRixDQUFDIn0=
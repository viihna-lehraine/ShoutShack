// File: server/src/tasks/logRotation.ts
import fs from 'fs-extra';
import path from 'path';
import { env } from '../config/env.js';
fs.ensureDirSync(env.LOG_ARCHIVE_DIR);
export const rotateLogs = async () => {
    console.log('Running Log Rotation Task...');
    const files = await fs.readdir(env.LOG_DIR);
    for (const file of files) {
        const filePath = path.join(env.LOG_DIR, file);
        const stats = await fs.stat(filePath);
        const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (fileAge > env.LOG_RETENTION_DAYS) {
            await fs.move(filePath, path.join(env.LOG_ARCHIVE_DIR, file));
            console.log(`Archived: ${file}`);
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nUm90YXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGFza3MvbG9nUm90YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0NBQXdDO0FBRXhDLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMxQixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRXZDLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBRXRDLE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxLQUFLLElBQUksRUFBRTtJQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFFNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5QyxNQUFNLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFFckUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDdEMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5RCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0YsQ0FBQztBQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZpbGU6IHNlcnZlci9zcmMvdGFza3MvbG9nUm90YXRpb24udHNcblxuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vY29uZmlnL2Vudi5qcyc7XG5cbmZzLmVuc3VyZURpclN5bmMoZW52LkxPR19BUkNISVZFX0RJUik7XG5cbmV4cG9ydCBjb25zdCByb3RhdGVMb2dzID0gYXN5bmMgKCkgPT4ge1xuXHRjb25zb2xlLmxvZygnUnVubmluZyBMb2cgUm90YXRpb24gVGFzay4uLicpO1xuXG5cdGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucmVhZGRpcihlbnYuTE9HX0RJUik7XG5cdGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGVudi5MT0dfRElSLCBmaWxlKTtcblx0XHRjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQoZmlsZVBhdGgpO1xuXHRcdGNvbnN0IGZpbGVBZ2UgPSAoRGF0ZS5ub3coKSAtIHN0YXRzLm10aW1lTXMpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuXG5cdFx0aWYgKGZpbGVBZ2UgPiBlbnYuTE9HX1JFVEVOVElPTl9EQVlTKSB7XG5cdFx0XHRhd2FpdCBmcy5tb3ZlKGZpbGVQYXRoLCBwYXRoLmpvaW4oZW52LkxPR19BUkNISVZFX0RJUiwgZmlsZSkpO1xuXHRcdFx0Y29uc29sZS5sb2coYEFyY2hpdmVkOiAke2ZpbGV9YCk7XG5cdFx0fVxuXHR9XG59O1xuIl19
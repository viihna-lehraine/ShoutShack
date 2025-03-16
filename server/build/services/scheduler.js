// File: server/src/services/scheduler.ts
import cron from 'node-cron';
const cronJobs = [];
export const registerCronJob = (schedule, task) => {
    cronJobs.push({ schedule, task });
};
export const startCronJobs = () => {
    for (const { schedule, task } of cronJobs) {
        cron.schedule(schedule, async () => {
            try {
                console.log(`Running scheduled task (${schedule})...`);
                await task();
                console.log(`Task completed successfully (${schedule})`);
            }
            catch (err) {
                console.error(`Scheduled task failed (${schedule}):`, err);
            }
        });
    }
    console.log('Cron Scheduler Initialized');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL3NjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5Q0FBeUM7QUFHekMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRTdCLE1BQU0sUUFBUSxHQUFjLEVBQUUsQ0FBQztBQUUvQixNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxRQUFnQixFQUFFLElBQWdDLEVBQUUsRUFBRTtJQUNyRixRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEdBQUcsRUFBRTtJQUNqQyxLQUFLLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksUUFBUSxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLFFBQVEsTUFBTSxDQUFDLENBQUM7Z0JBRXZELE1BQU0sSUFBSSxFQUFFLENBQUM7Z0JBRWIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixRQUFRLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1RCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyJ9
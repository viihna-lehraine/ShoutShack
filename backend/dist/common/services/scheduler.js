// File: backend/src/common/services/scheduler.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZXJ2aWNlcy9zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBR2pELE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUU3QixNQUFNLFFBQVEsR0FBYyxFQUFFLENBQUM7QUFFL0IsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBZ0IsRUFBRSxJQUFnQyxFQUFFLEVBQUU7SUFDckYsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxHQUFHLEVBQUU7SUFDakMsS0FBSyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xDLElBQUksQ0FBQztnQkFDSixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixRQUFRLE1BQU0sQ0FBQyxDQUFDO2dCQUV2RCxNQUFNLElBQUksRUFBRSxDQUFDO2dCQUViLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUQsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUMzQyxDQUFDLENBQUMifQ==
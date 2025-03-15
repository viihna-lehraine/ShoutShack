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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL3NjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5Q0FBeUM7QUFHekMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRTdCLE1BQU0sUUFBUSxHQUFjLEVBQUUsQ0FBQztBQUUvQixNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxRQUFnQixFQUFFLElBQWdDLEVBQUUsRUFBRTtJQUNyRixRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEdBQUcsRUFBRTtJQUNqQyxLQUFLLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksUUFBUSxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLFFBQVEsTUFBTSxDQUFDLENBQUM7Z0JBRXZELE1BQU0sSUFBSSxFQUFFLENBQUM7Z0JBRWIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixRQUFRLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1RCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZpbGU6IHNlcnZlci9zcmMvc2VydmljZXMvc2NoZWR1bGVyLnRzXG5cbmltcG9ydCB7IENyb25Kb2IgfSBmcm9tICcuLi90eXBlcy9pbmRleC5qcyc7XG5pbXBvcnQgY3JvbiBmcm9tICdub2RlLWNyb24nO1xuXG5jb25zdCBjcm9uSm9iczogQ3JvbkpvYltdID0gW107XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlckNyb25Kb2IgPSAoc2NoZWR1bGU6IHN0cmluZywgdGFzazogKCkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQpID0+IHtcblx0Y3JvbkpvYnMucHVzaCh7IHNjaGVkdWxlLCB0YXNrIH0pO1xufTtcblxuZXhwb3J0IGNvbnN0IHN0YXJ0Q3JvbkpvYnMgPSAoKSA9PiB7XG5cdGZvciAoY29uc3QgeyBzY2hlZHVsZSwgdGFzayB9IG9mIGNyb25Kb2JzKSB7XG5cdFx0Y3Jvbi5zY2hlZHVsZShzY2hlZHVsZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc29sZS5sb2coYFJ1bm5pbmcgc2NoZWR1bGVkIHRhc2sgKCR7c2NoZWR1bGV9KS4uLmApO1xuXG5cdFx0XHRcdGF3YWl0IHRhc2soKTtcblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgVGFzayBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5ICgke3NjaGVkdWxlfSlgKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBTY2hlZHVsZWQgdGFzayBmYWlsZWQgKCR7c2NoZWR1bGV9KTpgLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cdGNvbnNvbGUubG9nKCdDcm9uIFNjaGVkdWxlciBJbml0aWFsaXplZCcpO1xufTtcbiJdfQ==
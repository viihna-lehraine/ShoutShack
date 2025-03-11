import { env } from '../../config/env.js';
import pino from 'pino';
export const logger = pino.default({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
        }
    },
    level: env.LOG_LEVEL
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZXJ2aWNlcy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUV4QixNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUNsQyxTQUFTLEVBQUU7UUFDVixNQUFNLEVBQUUsYUFBYTtRQUNyQixPQUFPLEVBQUU7WUFDUixRQUFRLEVBQUUsSUFBSTtZQUNkLGFBQWEsRUFBRSxZQUFZO1lBQzNCLE1BQU0sRUFBRSxjQUFjO1NBQ3RCO0tBQ0Q7SUFDRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVM7Q0FDcEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vLi4vY29uZmlnL2Vudi5qcyc7XG5pbXBvcnQgcGlubyBmcm9tICdwaW5vJztcblxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IHBpbm8uZGVmYXVsdCh7XG5cdHRyYW5zcG9ydDoge1xuXHRcdHRhcmdldDogJ3Bpbm8tcHJldHR5Jyxcblx0XHRvcHRpb25zOiB7XG5cdFx0XHRjb2xvcml6ZTogdHJ1ZSxcblx0XHRcdHRyYW5zbGF0ZVRpbWU6ICdISDpNTTpzcyBaJyxcblx0XHRcdGlnbm9yZTogJ3BpZCxob3N0bmFtZSdcblx0XHR9XG5cdH0sXG5cdGxldmVsOiBlbnYuTE9HX0xFVkVMXG59KTtcbiJdfQ==
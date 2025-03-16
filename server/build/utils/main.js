// File: server/src/utils/main.ts
const parseBoolean = (value) => {
    if (!value)
        throw new Error('Missing required boolean environment variable!');
    const normalized = value.trim().toLowerCase();
    if (['true', 't', '1', 'yes', 'on'].includes(normalized))
        return true;
    if (['false', 'f', '0', 'no', 'off'].includes(normalized))
        return false;
    throw new Error(`Invalid boolean for environment variable! Value: "${value}"`);
};
const parseNumber = (value) => {
    if (!value)
        throw new Error('Missing required number environment variable!');
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid number for environment variable! Value: "${value}"`);
    }
    return parsed;
};
const parseString = (value, envVarName) => {
    if (!value)
        throw new Error(`Missing required environment variable: ${envVarName}`);
    return value;
};
export const utils = {
    parseBoolean,
    parseNumber,
    parseString
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlDQUFpQztBQUlqQyxNQUFNLFlBQVksR0FBRyxDQUFDLEtBQXlCLEVBQVcsRUFBRTtJQUMzRCxJQUFJLENBQUMsS0FBSztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztJQUM5RSxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFFOUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDdEUsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFeEUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNoRixDQUFDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQXlCLEVBQVUsRUFBRTtJQUN6RCxJQUFJLENBQUMsS0FBSztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztJQUM3RSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRW5DLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQXlCLEVBQUUsVUFBa0IsRUFBVSxFQUFFO0lBQzdFLElBQUksQ0FBQyxLQUFLO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUNwRixPQUFPLEtBQUssQ0FBQztBQUNkLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBYztJQUMvQixZQUFZO0lBQ1osV0FBVztJQUNYLFdBQVc7Q0FDWCxDQUFDIn0=
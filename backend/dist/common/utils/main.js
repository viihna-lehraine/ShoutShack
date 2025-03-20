// File: backend/src/utils/main.ts
const parseBoolean = (value) => {
    if (!value)
        throw new Error('Missing required boolean environment variable!');
    const normalized = value.trim().toLowerCase();
    if (['true', 't', '1', 'yes', 'y', 'on'].includes(normalized))
        return true;
    if (['false', 'f', '0', 'no', 'n', 'off'].includes(normalized))
        return false;
    throw new Error(`Invalid boolean for environment variable! Value: "${value}"`);
};
const parseNumber = (value) => {
    if (!value)
        throw new Error('Missing required number environment variable!');
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error(`Invalid number for environment variable! Value: "${value}"`);
    }
    return parsed;
};
const parseString = (value, envVarName) => {
    if (!value)
        throw new Error(`Missing required environment variable: ${envVarName}`);
    return value.trim();
};
export const utils = {
    parseBoolean,
    parseNumber,
    parseString
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vdXRpbHMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxrQ0FBa0M7QUFJbEMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUF5QixFQUFXLEVBQUU7SUFDM0QsSUFBSSxDQUFDLEtBQUs7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7SUFDOUUsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRTlDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUMzRSxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFN0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNoRixDQUFDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQXlCLEVBQVUsRUFBRTtJQUN6RCxJQUFJLENBQUMsS0FBSztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztJQUM3RSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFakMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBeUIsRUFBRSxVQUFrQixFQUFVLEVBQUU7SUFDN0UsSUFBSSxDQUFDLEtBQUs7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBYztJQUMvQixZQUFZO0lBQ1osV0FBVztJQUNYLFdBQVc7Q0FDWCxDQUFDIn0=
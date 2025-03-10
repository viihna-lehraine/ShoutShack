/*
 * This file is part of ShoutShack.
 *
 * ShoutShack is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ShoutShack is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ShoutShack. If not, see <https://www.gnu.org/licenses/>.
 */
import Fastify from 'fastify';
const fastify = Fastify({ logger: true });
fastify.get('/', async () => {
    return { message: 'ShoutShack API is running!' };
});
fastify.get('/api/', async () => {
    return { message: 'ShoutShack API via Nginx!' };
});
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Fastify server running at http://localhost:3000/');
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBRUgsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBRTlCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBRTFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQzNCLE9BQU8sRUFBRSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztBQUNsRCxDQUFDLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQy9CLE9BQU8sRUFBRSxPQUFPLEVBQUUsMkJBQTJCLEVBQUUsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQztBQUVILE1BQU0sS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQ3hCLElBQUksQ0FBQztRQUNKLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7QUFDRixDQUFDLENBQUM7QUFFRixLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBTaG91dFNoYWNrLlxuICpcbiAqIFNob3V0U2hhY2sgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFNob3V0U2hhY2sgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqIGFsb25nIHdpdGggU2hvdXRTaGFjay4gSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5pbXBvcnQgRmFzdGlmeSBmcm9tICdmYXN0aWZ5JztcblxuY29uc3QgZmFzdGlmeSA9IEZhc3RpZnkoeyBsb2dnZXI6IHRydWUgfSk7XG5cbmZhc3RpZnkuZ2V0KCcvJywgYXN5bmMgKCkgPT4ge1xuXHRyZXR1cm4geyBtZXNzYWdlOiAnU2hvdXRTaGFjayBBUEkgaXMgcnVubmluZyEnIH07XG59KTtcblxuZmFzdGlmeS5nZXQoJy9hcGkvJywgYXN5bmMgKCkgPT4ge1xuXHRyZXR1cm4geyBtZXNzYWdlOiAnU2hvdXRTaGFjayBBUEkgdmlhIE5naW54IScgfTtcbn0pO1xuXG5jb25zdCBzdGFydCA9IGFzeW5jICgpID0+IHtcblx0dHJ5IHtcblx0XHRhd2FpdCBmYXN0aWZ5Lmxpc3Rlbih7IHBvcnQ6IDMwMDAsIGhvc3Q6ICcwLjAuMC4wJyB9KTtcblx0XHRjb25zb2xlLmxvZygnRmFzdGlmeSBzZXJ2ZXIgcnVubmluZyBhdCBodHRwOi8vbG9jYWxob3N0OjMwMDAvJyk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdH1cbn07XG5cbnN0YXJ0KCk7XG4iXX0=
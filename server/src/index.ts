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
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

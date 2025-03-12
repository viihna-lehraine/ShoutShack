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
 *
 */

import { initBrowsePage } from './browse.js';
import { initFaqPage } from './faq.js';

const pageHandlers: Record<string, () => void> = {
	browse: initBrowsePage,
	faq: initFaqPage
};

document.addEventListener('DOMContentLoaded', () => {
	const page = document.body.dataset.page ?? '';

	if (page in pageHandlers) {
		pageHandlers[page]();
	}
});

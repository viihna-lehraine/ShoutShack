import { MutexContract } from '../../types/index.js';

export class Mutex implements MutexContract {
	#locked: boolean = false;
	#waiting: Array<() => void> = [];

	async lock() {
		if (this.#locked) {
			await new Promise<void>(resolve => this.#waiting.push(resolve));
		}
		this.#locked = true;
	}

	unlock() {
		this.#locked = false;
		if (this.#waiting.length > 0) {
			const next = this.#waiting.shift();
			next && next();
		}
	}
}

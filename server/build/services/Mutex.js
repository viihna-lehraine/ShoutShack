// File: server/src/services/Mutex.ts
export class Mutex {
    #locked = false;
    #waiting = [];
    async lock() {
        if (this.#locked) {
            await new Promise(resolve => this.#waiting.push(resolve));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXV0ZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvTXV0ZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBSXJDLE1BQU0sT0FBTyxLQUFLO0lBQ2pCLE9BQU8sR0FBWSxLQUFLLENBQUM7SUFDekIsUUFBUSxHQUFzQixFQUFFLENBQUM7SUFFakMsS0FBSyxDQUFDLElBQUk7UUFDVCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQixNQUFNLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVELE1BQU07UUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbkMsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ2hCLENBQUM7SUFDRixDQUFDO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaWxlOiBzZXJ2ZXIvc3JjL3NlcnZpY2VzL011dGV4LnRzXG5cbmltcG9ydCB7IE11dGV4Q29udHJhY3QgfSBmcm9tICcuLi90eXBlcy9pbmRleC5qcyc7XG5cbmV4cG9ydCBjbGFzcyBNdXRleCBpbXBsZW1lbnRzIE11dGV4Q29udHJhY3Qge1xuXHQjbG9ja2VkOiBib29sZWFuID0gZmFsc2U7XG5cdCN3YWl0aW5nOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG5cdGFzeW5jIGxvY2soKSB7XG5cdFx0aWYgKHRoaXMuI2xvY2tlZCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB0aGlzLiN3YWl0aW5nLnB1c2gocmVzb2x2ZSkpO1xuXHRcdH1cblx0XHR0aGlzLiNsb2NrZWQgPSB0cnVlO1xuXHR9XG5cblx0dW5sb2NrKCkge1xuXHRcdHRoaXMuI2xvY2tlZCA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLiN3YWl0aW5nLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IG5leHQgPSB0aGlzLiN3YWl0aW5nLnNoaWZ0KCk7XG5cdFx0XHRuZXh0ICYmIG5leHQoKTtcblx0XHR9XG5cdH1cbn1cbiJdfQ==
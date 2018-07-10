export class ReferenceCounter {
    private _count: number;

    constructor() {
        this._count = 0;
    }

    increment(): void {
        this._count++;
    }

    decrement(): void {
        this._count--;
        if (this._count < 0) throw "Reference Counter is negative";
    }

    get count(): number {
        return this._count;
    }
}

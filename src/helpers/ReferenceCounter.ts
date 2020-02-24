export class ReferenceCounter {
    private _count: number;

    public constructor() {
        this._count = 0;
    }

    public increment(): void {
        this._count++;
    }

    public decrement(): void {
        this._count--;
        if (this._count < 0) throw new Error("Reference Counter is negative");
    }

    public get count(): number {
        return this._count;
    }
}

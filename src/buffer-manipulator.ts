
export class BufferManipulator {

    private buffer: Uint8Array = new Uint8Array(0);
    private offset: number = 0;

    constructor(size: number) {
        this.clear(size);
    }

    public clear(size: number): void {
        this.buffer = new Uint8Array(size);
        this.offset = 0;
    }

    public getBuffer(clone: boolean = false): Uint8Array {
        if (clone === true) {
            return this.buffer.slice();
        }
        return this.buffer;
    }

    public append<T extends any[]>(writer: (data: Uint8Array, offset: number, ...args: T) => number, ...args: T): void {
        this.offset = writer(this.buffer, this.offset, ...args);
        if (this.offset > this.buffer.length || this.offset < 0) {
            throw new Error('Buffer overflow: Attempted to write beyond buffer length.');
        }
    }

    public consume<T extends any[]>(reader: (data: Uint8Array, offset: number, ...args: T) => number, ...args: T): void {
        this.offset = reader(this.buffer, this.offset, ...args);
        if (this.offset < 0 || this.offset > this.buffer.length) {
            throw new Error('Buffer overflow: Attempted to read beyond buffer length.');
        }
    }

}
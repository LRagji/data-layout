
export class BufferManipulator {

    private buffer: Uint8Array = new Uint8Array(0);
    private bufferView: DataView = new DataView(this.buffer.buffer);
    private readCursor: number = 0;
    private writeCursor: number = 0;

    constructor(size: number) {
        this.clear(size);
    }

    public clear(size: number): void {
        this.buffer = new Uint8Array(size);
        this.bufferView = new DataView(this.buffer.buffer);
        this.readCursor = 0;
        this.writeCursor = 0;
    }

    public info(): { size: number; readCursor: number; writeCursor: number; } {
        return {
            size: this.buffer.length,
            readCursor: this.readCursor,
            writeCursor: this.writeCursor,
        };
    }

    public getBuffer(clone: boolean = false): Uint8Array {
        if (clone === true) {
            return this.buffer.slice();
        }
        return this.buffer;
    }

    public append<T extends any[]>(writer: (data: DataView, offset: number, ...args: T) => number, ...args: T): void {
        this.writeCursor = writer(this.bufferView, this.writeCursor, ...args);
        if (this.writeCursor > this.buffer.length || this.writeCursor < 0) {
            throw new Error('Buffer overflow: Attempted to write beyond buffer length.');
        }
    }

    public consume<T extends any[]>(reader: (data: DataView, offset: number, ...args: T) => number, ...args: T): void {
        this.readCursor = reader(this.bufferView, this.readCursor, ...args);
        if (this.readCursor < 0 || this.readCursor > this.buffer.length) {
            throw new Error('Buffer overflow: Attempted to read beyond buffer length.');
        }
    }

}
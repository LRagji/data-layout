import sinon from 'sinon';
import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { BufferManipulator } from '../src/buffer-manipulator.ts';

describe('BufferManipulator', () => {
    describe('unit-tests', () => {

        describe('clear', () => {
            let manipulator: BufferManipulator;

            beforeEach(() => {
                manipulator = new BufferManipulator(10);
            });

            it('should create a new buffer with the specified size', () => {
                manipulator.clear(20);
                const buffer = manipulator.getBuffer();
                assert.strictEqual(buffer.length, 20);
            });

            it('should reset offset to 0', () => {
                const writer = sinon.stub().returns(5);
                manipulator.append(writer);
                manipulator.clear(10);
                const reader = sinon.stub().returns(3);
                manipulator.consume(reader);
                assert.strictEqual(reader.firstCall.args[1], 0);
            });

            it('should replace existing buffer', () => {
                const oldBuffer = manipulator.getBuffer();
                manipulator.clear(15);
                const newBuffer = manipulator.getBuffer();
                assert.notStrictEqual(oldBuffer, newBuffer);
                assert.strictEqual(newBuffer.length, 15);
            });

            it('should initialize buffer with zeros', () => {
                manipulator.clear(5);
                const buffer = manipulator.getBuffer();
                assert.deepStrictEqual(Array.from(buffer), [0, 0, 0, 0, 0]);
            });

            it('should handle size of 0', () => {
                manipulator.clear(0);
                const buffer = manipulator.getBuffer();
                assert.strictEqual(buffer.length, 0);
            });
        });

        describe('getBuffer', () => {
            let manipulator: BufferManipulator;

            beforeEach(() => {
                manipulator = new BufferManipulator(5);
            });

            it('should return the same buffer reference when clone is false', () => {
                const buffer1 = manipulator.getBuffer(false);
                const buffer2 = manipulator.getBuffer(false);
                assert.strictEqual(buffer1, buffer2);
            });

            it('should return a cloned buffer when clone is true', () => {
                const original = manipulator.getBuffer(false);
                const cloned = manipulator.getBuffer(true);
                assert.notStrictEqual(original, cloned);
                assert.deepStrictEqual(original, cloned);
            });

            it('should return original buffer by default', () => {
                const buffer1 = manipulator.getBuffer();
                const buffer2 = manipulator.getBuffer();
                assert.strictEqual(buffer1, buffer2);
            });

            it('should not mutate original when cloned buffer is modified', () => {
                const original = manipulator.getBuffer(false);
                const clone = manipulator.getBuffer(true);
                clone[0] = 99;
                assert.notStrictEqual(original[0], 99);
            });

            it('should produce distinct clones on successive calls', () => {
                const clone1 = manipulator.getBuffer(true);
                const clone2 = manipulator.getBuffer(true);
                assert.notStrictEqual(clone1, clone2);
            });
        });

        describe('append', () => {
            let manipulator: BufferManipulator;

            beforeEach(() => {
                manipulator = new BufferManipulator(10);
            });

            it('should call writer with buffer, offset, and additional args', () => {
                const writer = sinon.stub().returns(5);
                manipulator.append(writer, 'arg1', 42);
                assert.strictEqual(writer.callCount, 1);
                assert.strictEqual(writer.firstCall.args[1], 0);
                assert.strictEqual(writer.firstCall.args[2], 'arg1');
                assert.strictEqual(writer.firstCall.args[3], 42);
            });

            it('should update offset after append', () => {
                const writer = sinon.stub().returns(7);
                manipulator.append(writer);
                const writer2 = sinon.stub().returns(9);
                manipulator.append(writer2);
                assert.strictEqual(writer2.firstCall.args[1], 7);
            });

            it('should handle multiple appends', () => {
                const writer1 = sinon.stub().returns(3);
                const writer2 = sinon.stub().returns(6);
                const writer3 = sinon.stub().returns(9);
                manipulator.append(writer1);
                manipulator.append(writer2);
                manipulator.append(writer3);
                assert.strictEqual(writer3.firstCall.args[1], 6);
            });

            it('should not allow writing beyond buffer bounds', () => {
                const writer = sinon.stub().returns(15);
                assert.throws(() => { manipulator.append(writer); });
            });

            it('should write a byte via DataView and update buffer', () => {
                // Real writer that uses DataView.setUint8
                const writer = (view: DataView, offset: number, value: number): number => {
                    view.setUint8(offset, value);
                    return offset + 1;
                };
                manipulator.append(writer, 255);
                const buf = manipulator.getBuffer();
                assert.strictEqual(buf[0], 255);
            });

            it('should allow writer that does not advance offset', () => {
                const writerNoAdvance = sinon.stub().callsFake((_: DataView, offset: number) => offset);
                manipulator.append(writerNoAdvance);
                const writer2 = sinon.stub().returns(5);
                manipulator.append(writer2);
                // Second writer should still see original offset (0) because first did not advance
                assert.strictEqual(writerNoAdvance.firstCall.args[1], 0);
                assert.strictEqual(writer2.firstCall.args[1], 0);
            });

            it('should throw with correct message on negative offset', () => {
                const writerNeg = sinon.stub().returns(-5);
                assert.throws(() => manipulator.append(writerNeg), {
                    message: 'Buffer overflow: Attempted to write beyond buffer length.'
                });
            });
        });

        describe('consume', () => {
            let manipulator: BufferManipulator;

            beforeEach(() => {
                manipulator = new BufferManipulator(10);
            });

            it('should call reader with buffer, offset, and additional args', () => {
                const reader = sinon.stub().returns(4);
                manipulator.consume(reader, 'test', true, 123);
                assert.strictEqual(reader.callCount, 1);
                assert.strictEqual(reader.firstCall.args[1], 0);
                assert.strictEqual(reader.firstCall.args[2], 'test');
                assert.strictEqual(reader.firstCall.args[3], true);
                assert.strictEqual(reader.firstCall.args[4], 123);
            });

            it('should update offset after consume', () => {
                const reader = sinon.stub().returns(5);
                manipulator.consume(reader);
                const reader2 = sinon.stub().returns(8);
                manipulator.consume(reader2);
                assert.strictEqual(reader2.firstCall.args[1], 5);
            });

            it('should handle multiple consumes', () => {
                const reader1 = sinon.stub().returns(2);
                const reader2 = sinon.stub().returns(5);
                const reader3 = sinon.stub().returns(7);
                manipulator.consume(reader1);
                manipulator.consume(reader2);
                manipulator.consume(reader3);
                assert.strictEqual(reader3.firstCall.args[1], 5);
            });

            it('should not allow reading beyond buffer bounds', () => {
                const reader = sinon.stub().returns(20);
                assert.throws(() => { manipulator.consume(reader); });
            });

            it('should allow reader that does not advance offset', () => {
                const readerNoAdvance = sinon.stub().callsFake((_: DataView, offset: number) => offset);
                manipulator.consume(readerNoAdvance);
                const reader2 = sinon.stub().returns(3);
                manipulator.consume(reader2);
                assert.strictEqual(readerNoAdvance.firstCall.args[1], 0);
                assert.strictEqual(reader2.firstCall.args[1], 0);
            });

            it('should allow boundary offset equal to buffer length after operations', () => {
                // Fill buffer to its length via writer stubs advancing offset one by one
                const writer = (view: DataView, offset: number): number => {
                    if (offset < 10) {
                        view.setUint8(offset, offset);
                    }
                    return offset + 1;
                };
                for (let i = 0; i < 10; i++) {
                    manipulator.append(writer);
                }
                // Reader returns same boundary length (10) - should be valid
                const readerBoundary = sinon.stub().returns(10);
                assert.doesNotThrow(() => manipulator.consume(readerBoundary));
                // Read cursor starts at 0 despite writes
                assert.strictEqual(readerBoundary.firstCall.args[1], 0);
            });

            it('should throw with correct message on negative offset from reader', () => {
                const readerNeg = sinon.stub().returns(-2);
                assert.throws(() => manipulator.consume(readerNeg), {
                    message: 'Buffer overflow: Attempted to read beyond buffer length.'
                });
            });
        });

    });

    describe('integration', () => {
        let manipulator: BufferManipulator;

        beforeEach(() => {
            manipulator = new BufferManipulator(10);
        });

        it('should handle mixed append and consume operations', () => {
            const writer = sinon.stub().returns(3);
            const reader = sinon.stub().returns(7);
            manipulator.append(writer);
            manipulator.consume(reader);
            // With separate cursors, write cursor advances, read cursor starts at 0
            assert.strictEqual(writer.firstCall.args[1], 0);
            assert.strictEqual(reader.firstCall.args[1], 0);
        });

        it('should maintain offset across operations', () => {
            const writer1 = sinon.stub().returns(2);
            const reader1 = sinon.stub().returns(5);
            const writer2 = sinon.stub().returns(8);
            manipulator.append(writer1);
            manipulator.consume(reader1);
            manipulator.append(writer2);
            // Second writer sees previous write cursor (2), not read cursor (5)
            assert.strictEqual(writer2.firstCall.args[1], 2);
        });

        it('should report correct cursors via info()', () => {
            const writer = sinon.stub().returns(4);
            manipulator.append(writer);
            const reader = sinon.stub().returns(3);
            manipulator.consume(reader);
            const info = (manipulator as any).info();
            assert.deepStrictEqual(info, { size: 10, readCursor: 3, writeCursor: 4 });
        });

        it('should keep readCursor independent from writeCursor', () => {
            const w1 = sinon.stub().returns(5);
            manipulator.append(w1);
            const r1 = sinon.stub().returns(2);
            manipulator.consume(r1);
            const r2 = sinon.stub().returns(4);
            manipulator.consume(r2);
            const info = (manipulator as any).info();
            assert.strictEqual(w1.firstCall.args[1], 0);
            assert.strictEqual(r1.firstCall.args[1], 0); // read starts at 0
            assert.strictEqual(r2.firstCall.args[1], 2); // read advanced independently
            assert.deepStrictEqual(info, { size: 10, readCursor: 4, writeCursor: 5 });
        });

        it('should allow offset at buffer length boundary', () => {
            const writer = sinon.stub().returns(10);
            manipulator.append(writer);
            assert.strictEqual(writer.firstCall.args[1], 0);
        });

        it('should handle negative offset from reader', () => {
            const reader = sinon.stub().returns(-1);
            assert.throws(() => { manipulator.consume(reader); }, /Buffer overflow/);
        });

        it('should handle negative offset from writer', () => {
            const writer = sinon.stub().returns(-1);
            assert.throws(() => { manipulator.append(writer); }, /Buffer overflow/);
        });

        it('should clear and reset offset mid-operation', () => {
            const writer = sinon.stub().returns(5);
            manipulator.append(writer);
            manipulator.clear(20);
            const writer2 = sinon.stub().returns(10);
            manipulator.append(writer2);
            assert.strictEqual(writer2.firstCall.args[1], 0);
            assert.strictEqual(manipulator.getBuffer().length, 20);
        });

        it('should properly validate offset equals buffer length', () => {
            const writer = sinon.stub().returns(10);
            assert.doesNotThrow(() => { manipulator.append(writer); });
        });

        it('should throw error with correct message on write overflow', () => {
            const writer = sinon.stub().returns(11);
            assert.throws(() => {
                manipulator.append(writer);
            }, {
                message: 'Buffer overflow: Attempted to write beyond buffer length.'
            });
        });

        it('should throw error with correct message on read overflow', () => {
            const reader = sinon.stub().returns(11);
            assert.throws(() => {
                manipulator.consume(reader);
            }, {
                message: 'Buffer overflow: Attempted to read beyond buffer length.'
            });
        });
    });
});

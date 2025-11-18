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
            assert.strictEqual(writer.firstCall.args[1], 0);
            assert.strictEqual(reader.firstCall.args[1], 3);
        });

        it('should maintain offset across operations', () => {
            const writer1 = sinon.stub().returns(2);
            const reader1 = sinon.stub().returns(5);
            const writer2 = sinon.stub().returns(8);
            manipulator.append(writer1);
            manipulator.consume(reader1);
            manipulator.append(writer2);
            assert.strictEqual(writer2.firstCall.args[1], 5);
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

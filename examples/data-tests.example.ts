import sinon from 'sinon';
import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { BufferManipulator, encode32bitArray } from '../src/index.ts';

describe('Data Tests', () => {

    describe('Playground', () => {
        let manipulator: BufferManipulator;

        beforeEach(() => {
            manipulator = new BufferManipulator((1000 * 4) + 100); //1000 32-bit numbers + some room
        });

        it('Size calculation.', () => {
            const data: number[] = [];
            for (let i = 0; i < 1000; i++) {
                data.push(Math.random() * 1000);
            }

            manipulator.append(encode32bitArray, data);
            const info = manipulator.info();
            assert.strictEqual(info.writeCursor, 4004);
            // Expected: 4004 bytes (4 bytes header + 4000 bytes data)
        });
    });
});
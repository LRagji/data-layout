
export function encode32bitArray(buffer: DataView, offset: number, data: number[]): number {
    //4 Byte Header
    //Set the first byte as version to 01,
    //Set the second byte to indicate its 32bit array by setting 01
    //Set the third and fourth byte to 0(future)

    buffer.setUint8(offset++, 1); //version
    buffer.setUint8(offset++, 1); //32bit array
    buffer.setUint8(offset++, 0); //future
    buffer.setUint8(offset++, 0); //future
    for (const num of data) {
        buffer.setFloat32(offset, num, true); //little-endian
        offset += 4;
    }
    return offset;
}
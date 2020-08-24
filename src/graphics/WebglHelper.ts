import { TypedArray } from "types/types";

export namespace WebGL {
    export function buildBuffer(
        gl: WebGL2RenderingContext,
        type: 34963 | 34962 | number,
        data: ArrayBufferView | TypedArray,
        offset: number = 0,
        length?: number
    ): WebGLBuffer {
        const buffer: WebGLBuffer = gl.createBuffer()!;
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW, offset, length);
        return buffer;
    }
}

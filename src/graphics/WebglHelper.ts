export namespace WebGL {
    import TypedArray = NodeJS.TypedArray;

    export function buildBuffer(
        gl: WebGL2RenderingContext,
        type: number,
        data: ArrayBufferView | TypedArray
    ): WebGLBuffer {
        const buffer: WebGLBuffer = gl.createBuffer()!;
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        return buffer;
    }
}

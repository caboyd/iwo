import { ReferenceCounter } from "@helpers/ReferenceCounter";
import { TypedArray } from "../customtypes/types";
import { GL } from "./WebglConstants";
import { WebGL } from "./WebglHelper";

export class IndexBuffer {
    public readonly EBO: WebGLBuffer;
    public readonly type: typeof GL.UNSIGNED_SHORT | typeof GL.UNSIGNED_INT;
    public readonly references: ReferenceCounter;

    public constructor(gl: WebGL2RenderingContext, buffer: TypedArray) {
        this.type = buffer.BYTES_PER_ELEMENT == 2 ? GL.UNSIGNED_SHORT : GL.UNSIGNED_INT;
        this.EBO = WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.references = new ReferenceCounter();
    }

    // public bufferData(gl: WebGL2RenderingContext, buffer: TypedArray) {
    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW, 0);
    // }

    public bind(gl: WebGL2RenderingContext): void {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        } else {
            gl.deleteBuffer(this.EBO);
        }
    }
}

import { ReferenceCounter } from "../helpers/ReferenceCounter";

export interface IndexBuffer {
    EBO: WebGLBuffer;
    indices: Uint16Array | Uint32Array;
    readonly references: ReferenceCounter;

    destroy(gl: WebGL2RenderingContext): void;
}

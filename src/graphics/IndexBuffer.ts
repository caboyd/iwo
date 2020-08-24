import { Geometry } from "geometry/Geometry";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { WebGL } from "./WebglHelper";
import { BufferedGeometry } from "geometry/BufferedGeometry";

export class IndexBuffer {
    public readonly EBO: WebGLBuffer;
    public readonly indices: Uint16Array | Uint32Array;
    public readonly references: ReferenceCounter;

    public constructor(gl: WebGL2RenderingContext, geometry: BufferedGeometry, stop?: boolean) {
        if (geometry.index_buffer === undefined)
            throw new Error("Cannot create IndexBuffer. Geometry.index_buffer is undefined.");

        const b = geometry.index_buffer.buffer;
        this.indices = b.BYTES_PER_ELEMENT == 2 ? (b as Uint16Array) : (b as Uint32Array);
        this.EBO = stop ? gl.createBuffer()! : WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, b);
        this.references = new ReferenceCounter();
    }

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

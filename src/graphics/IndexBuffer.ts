import { BufferedGeometry, Geometry, isBufferedGeometry } from "geometry/Geometry";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { WebGL } from "./WebglHelper";

export class IndexBuffer {
    public readonly EBO: WebGLBuffer;
    public readonly indices: Uint16Array | Uint32Array;
    public readonly references: ReferenceCounter;

    public constructor(gl: WebGL2RenderingContext, geometry: Geometry | BufferedGeometry) {
        if ("indices" in geometry && geometry.indices) {
            this.indices = geometry.indices;
        } else if (isBufferedGeometry(geometry) && geometry.index_buffer) {
            this.indices =
                geometry.index_buffer.buffer.BYTES_PER_ELEMENT == 2
                    ? (geometry.index_buffer.buffer as Uint16Array)
                    : (geometry.index_buffer.buffer as Uint32Array);
        } else {
            throw new Error("Geometry has no indices.");
        }

        this.EBO = WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, this.indices);
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

import { Geometry } from "../geometry/Geometry";
import { ReferenceCounter } from "src/helpers/ReferenceCounter";
import { WebGL } from "./WebglHelper";

export class IndexBuffer {
    public readonly EBO: WebGLBuffer;
    public readonly indices: Uint16Array | Uint32Array;
    readonly references: ReferenceCounter;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        this.EBO = WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.indices!);
        this.indices = geometry.indices!;
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

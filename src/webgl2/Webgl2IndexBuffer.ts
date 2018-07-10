import { IndexBuffer } from "../meshes/IndexBuffer";
import { Geometry } from "../geometry/Geometry";
import { Webgl2 } from "./Webgl2Buffer";
import { ReferenceCounter } from "../helpers/ReferenceCounter";

export class Webgl2IndexBuffer implements IndexBuffer {
    public readonly EBO: WebGLBuffer;
    public readonly indices: Uint16Array | Uint32Array;
    readonly references: ReferenceCounter;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        this.EBO = Webgl2.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.indices!);
        this.indices = geometry.indices!;
        this.references = new ReferenceCounter();
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

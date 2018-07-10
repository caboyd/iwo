import { Webgl2 } from "./Webgl2Buffer";
import { AttributeType, Geometry } from "src/geometry/Geometry";
import { VertexBuffer } from "src/meshes/VertexBuffer";
import { ReferenceCounter } from "src/helpers/ReferenceCounter";

export class Webgl2VertexBuffer implements VertexBuffer {
    public attribute_flags: number;
    public attributes: Map<AttributeType, ArrayBufferView>;
    public attribute_buffers: Map<AttributeType, WebGLBuffer>;
    public VBO: WebGLBuffer | undefined;
    public readonly interleaved: boolean;
    public readonly references: ReferenceCounter;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        this.attributes = geometry.attributes;
        this.attribute_buffers = new Map<AttributeType, ArrayBufferView>();
        this.attribute_flags = geometry.attribute_flags;
        this.interleaved = geometry.isInterleaved;
        this.references = new ReferenceCounter();

        if (this.interleaved && geometry.interleaved_attributes) {
            this.VBO = Webgl2.buildBuffer(gl, gl.ARRAY_BUFFER, geometry.interleaved_attributes);
        } else this.initSeparateBuffers(gl);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        } else {
            if (this.VBO) gl.deleteBuffer(this.VBO);
            for (let buffer of this.attribute_buffers.values()) {
                gl.deleteBuffer(buffer);
            }
        }
    }

    private initSeparateBuffers(gl: WebGL2RenderingContext): void {
        let data;
        if (this.attribute_flags & AttributeType.Vertex && (data = this.attributes.get(AttributeType.Vertex)) != null)
            this.attribute_buffers.set(AttributeType.Vertex, Webgl2.buildBuffer(gl, gl.ARRAY_BUFFER, data));
        if ((data = this.attributes.get(AttributeType.Tex_Coords)) != null)
            this.attribute_buffers.set(AttributeType.Tex_Coords, Webgl2.buildBuffer(gl, gl.ARRAY_BUFFER, data));
        if ((data = this.attributes.get(AttributeType.Normals)) != null)
            this.attribute_buffers.set(AttributeType.Normals, Webgl2.buildBuffer(gl, gl.ARRAY_BUFFER, data));
    }
}

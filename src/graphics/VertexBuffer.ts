import { WebGL } from "./WebglHelper";
import { AttributeType, Geometry } from "src/geometry/Geometry";
import { ReferenceCounter } from "src/helpers/ReferenceCounter";
import { AttributeBuffer } from "./AttributeBuffer";

export class VertexBuffer {
    public attribute_flags: number;
    public attributes: Map<AttributeType, ArrayBufferView>;
    public attribute_buffers: Map<AttributeType, AttributeBuffer>;
    public VBO: WebGLBuffer | undefined;
    public readonly interleaved: boolean;
    public readonly references: ReferenceCounter;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        this.attributes = geometry.attributes;
        this.attribute_buffers = new Map<AttributeType, AttributeBuffer>();
        this.attribute_flags = geometry.attribute_flags;
        this.interleaved = geometry.isInterleaved;
        this.references = new ReferenceCounter();

        if (this.interleaved && geometry.interleaved_attributes) {
            this.VBO = WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, geometry.interleaved_attributes);
        } else this.initSeparateBuffers(gl);
    }

    public bindBuffers(gl: WebGL2RenderingContext): void {
        if(this.interleaved){
            //TODO: add bind interleaved
        }else{
            this.bindBuffer(gl, 0, AttributeType.Vertex);
            this.bindBuffer(gl, 1, AttributeType.Tex_Coords);
            this.bindBuffer(gl, 2, AttributeType.Normals);
            this.bindBuffer(gl, 3, AttributeType.Tangents);
            this.bindBuffer(gl, 4, AttributeType.Bitangents); 
        }

    }

    private bindBuffer(gl: WebGL2RenderingContext, attribute_index: number, attribute_type: AttributeType): void {
        if (this.attribute_flags & attribute_type) {
            let attribute_buffer = this.attribute_buffers.get(attribute_type)!;
            gl.enableVertexAttribArray(attribute_index);
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute_buffer.buffer);
            gl.vertexAttribPointer(
                attribute_index,
                attribute_buffer.component_size,
                attribute_buffer.type,
                attribute_buffer.normalized,
                0,
                0
            );
        } else gl.disableVertexAttribArray(attribute_index);
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
            this.attribute_buffers.set(
                AttributeType.Vertex,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, false)
            );
        if ((data = this.attributes.get(AttributeType.Tex_Coords)) != null)
            this.attribute_buffers.set(
                AttributeType.Tex_Coords,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 2, gl.FLOAT, false)
            );
        if ((data = this.attributes.get(AttributeType.Normals)) != null)
            this.attribute_buffers.set(
                AttributeType.Normals,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
        if ((data = this.attributes.get(AttributeType.Tangents)) != null)
            this.attribute_buffers.set(
                AttributeType.Tangents,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
        if ((data = this.attributes.get(AttributeType.Bitangents)) != null)
            this.attribute_buffers.set(
                AttributeType.Bitangents,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
    }
}

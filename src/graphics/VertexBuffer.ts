import { WebGL } from "./WebglHelper";
import { AttributeType, Geometry } from "geometry/Geometry";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { AttributeBuffer } from "./AttributeBuffer";
import TypedArray = NodeJS.TypedArray;
import { Attribute, BufferedGeometry, isBufferedGeometry } from "geometry/BufferedGeometry";

export class VertexBuffer {
    public attributes: Attribute[];
    public attribute_buffer_views: Map<AttributeType, TypedArray>;
    public attribute_buffers: Map<AttributeType, AttributeBuffer>;
    public buffers: WebGLBuffer[];
    public VAO: WebGLVertexArrayObject | undefined;
    public VBO: WebGLBuffer | undefined;
    public interleaved: boolean = false;
    public readonly references: ReferenceCounter;
    public stride: number = 0;
    public readonly legacy: boolean = false;

    public constructor(gl: WebGL2RenderingContext, geometry: Geometry | BufferedGeometry) {
        this.attribute_buffers = new Map<AttributeType, AttributeBuffer>();
        this.attribute_buffer_views = new Map<AttributeType, TypedArray>();
        this.attributes = [];
        this.references = new ReferenceCounter();
        this.buffers = [];
        if (isBufferedGeometry(geometry)) {
            this.constructFromBufferedGeometry(gl, geometry);
        } else {
            this.legacy = true;
            if(geometry.interleaved_attributes !== undefined) this.interleaved = true;
            this.constructFromGeometry(gl, geometry as Geometry);
        }
    }

    private constructFromGeometry(gl: WebGL2RenderingContext, geometry: Geometry): void {
        this.attribute_buffer_views = geometry.attributes;

        if (geometry.interleaved_attributes !== undefined) {
            this.VBO = WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, geometry.interleaved_attributes);
            if (this.attribute_buffer_views.has(AttributeType.Vertex)) this.stride += 12;
            if (this.attribute_buffer_views.has(AttributeType.Tex_Coord)) this.stride += 8;
            if (this.attribute_buffer_views.has(AttributeType.Normal)) this.stride += 12;
            if (this.attribute_buffer_views.has(AttributeType.Tangent)) this.stride += 12;
            if (this.attribute_buffer_views.has(AttributeType.Bitangent)) this.stride += 12;
        } else this.initSeparateBuffers(gl);
    }

    private constructFromBufferedGeometry(gl: WebGL2RenderingContext, geometry: BufferedGeometry): void {
        this.attributes = geometry.attributes;

        this.VAO = gl.createVertexArray()!;
        gl.bindVertexArray(this.VAO);

        //Turn the geometry buffer into WebGLBuffers
        for (const buffer of geometry.buffers) {
            if (buffer.target != gl.ARRAY_BUFFER) continue;
            const b = WebGL.buildBuffer(gl, buffer.target, buffer.buffer);
            this.buffers.push(b);
        }

        //assert attribute index are in ascending order
        this.assertAttributeAsc();
        this.setupVAOBuffers(gl);
        gl.bindVertexArray(null);
    }

    private assertAttributeAsc(): void {
        let i = 0;
        for (const attrib of this.attributes) {
            if (i > attrib.buffer_index)
                throw new Error("Attributes should be in ascending buffer order to ensure binding order is correct");
            i = attrib.buffer_index;
        }
    }

    public setupVAOBuffers(gl: WebGL2RenderingContext): void {
        let buffer_index = -1;
        for (const attrib of this.attributes) {
            //Need to bind correct buffer
            if (attrib.buffer_index > buffer_index) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[attrib.buffer_index]);
                buffer_index = attrib.buffer_index;
            }

            gl.enableVertexAttribArray(attrib.type);
            gl.vertexAttribPointer(
                attrib.type,
                attrib.component_count,
                attrib.component_type,
                attrib.normalized ?? false,
                attrib.byte_stride ?? 0,
                attrib.byte_offset ?? 0
            );
        }
    }

    public bindBuffers(gl: WebGL2RenderingContext): void {
        if (this.legacy) {
            gl.bindVertexArray(null);
            if (this.interleaved) {
                let offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO!);
                if (this.attribute_buffer_views.has(AttributeType.Vertex)) {
                    gl.enableVertexAttribArray(0);
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, this.stride, offset);
                    offset += 12;
                } else gl.disableVertexAttribArray(0);

                if (this.attribute_buffer_views.has(AttributeType.Tex_Coord)) {
                    gl.enableVertexAttribArray(1);
                    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, this.stride, offset);
                    offset += 8;
                } else gl.disableVertexAttribArray(1);

                if (this.attribute_buffer_views.has(AttributeType.Normal)) {
                    gl.enableVertexAttribArray(2);
                    gl.vertexAttribPointer(2, 3, gl.FLOAT, true, this.stride, offset);
                    offset += 12;
                } else gl.disableVertexAttribArray(2);

                if (this.attribute_buffer_views.has(AttributeType.Tangent)) {
                    gl.enableVertexAttribArray(3);
                    gl.vertexAttribPointer(3, 3, gl.FLOAT, true, this.stride, offset);
                    offset += 12;
                } else gl.disableVertexAttribArray(3);

                if (this.attribute_buffer_views.has(AttributeType.Bitangent)) {
                    gl.enableVertexAttribArray(4);
                    gl.vertexAttribPointer(4, 3, gl.FLOAT, true, this.stride, offset);
                    offset += 12;
                } else gl.disableVertexAttribArray(4);
            } else {
                this.bindBuffer(gl, 0, AttributeType.Vertex);
                this.bindBuffer(gl, 1, AttributeType.Tex_Coord);
                this.bindBuffer(gl, 2, AttributeType.Normal);
                this.bindBuffer(gl, 3, AttributeType.Tangent);
                this.bindBuffer(gl, 4, AttributeType.Bitangent);
            }
        } else {
            gl.bindVertexArray(this.VAO!);
        }
    }

    private bindBuffer(gl: WebGL2RenderingContext, attribute_index: number, attribute_type: AttributeType): void {
        if (this.attribute_buffers.has(attribute_type)) {
            const attribute_buffer = this.attribute_buffers.get(attribute_type)!;
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

    private initSeparateBuffers(gl: WebGL2RenderingContext): void {
        let data;
        if ((data = this.attribute_buffer_views.get(AttributeType.Vertex)) != null)
            this.attribute_buffers.set(
                AttributeType.Vertex,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, false)
            );
        if ((data = this.attribute_buffer_views.get(AttributeType.Tex_Coord)) != null)
            this.attribute_buffers.set(
                AttributeType.Tex_Coord,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 2, gl.FLOAT, false)
            );
        if ((data = this.attribute_buffer_views.get(AttributeType.Normal)) != null)
            this.attribute_buffers.set(
                AttributeType.Normal,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
        if ((data = this.attribute_buffer_views.get(AttributeType.Tangent)) != null)
            this.attribute_buffers.set(
                AttributeType.Tangent,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
        if ((data = this.attribute_buffer_views.get(AttributeType.Bitangent)) != null)
            this.attribute_buffers.set(
                AttributeType.Bitangent,
                new AttributeBuffer(WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, data), 3, gl.FLOAT, true)
            );
    }

    public destroy(gl: WebGL2RenderingContext): void {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        } else {
            if (this.legacy) {
                if (this.VBO) gl.deleteBuffer(this.VBO);
                for (const buffer of this.attribute_buffers.values()) {
                    gl.deleteBuffer(buffer.buffer);
                }
            } else {
                if (this.VAO) gl.deleteVertexArray(this.VAO);
                for (const buffer of this.buffers) gl.deleteBuffer(buffer);
            }
        }
    }
}

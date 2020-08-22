import { WebGL } from "./WebglHelper";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { Attribute, Attributes, BufferedGeometry } from "geometry/BufferedGeometry";

export class VertexBuffer {
    public attributes: Attributes;
    public buffers: WebGLBuffer[];
    public VAO: WebGLVertexArrayObject | undefined;
    public readonly references: ReferenceCounter;
    public stride: number = 0;

    public constructor(gl: WebGL2RenderingContext, geometry: BufferedGeometry) {
        this.attributes = geometry.attributes;
        this.references = new ReferenceCounter();
        this.buffers = [];
        this.constructFromBufferedGeometry(gl, geometry);
    }

    private constructFromBufferedGeometry(gl: WebGL2RenderingContext, geometry: BufferedGeometry): void {
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
                throw new Error("Attributes must be in ascending buffer order to ensure binding order is correct");
            i = attrib.buffer_index;
        }
    }

    public setupVAOBuffers(gl: WebGL2RenderingContext): void {
        let buffer_index = -1;
        for (const attrib of this.attributes) {
            //Bind correct buffer
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
        gl.bindVertexArray(this.VAO!);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        } else {
            if (this.VAO) gl.deleteVertexArray(this.VAO);
            for (const buffer of this.buffers) gl.deleteBuffer(buffer);
        }
    }
}

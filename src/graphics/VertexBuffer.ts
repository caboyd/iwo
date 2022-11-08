import { WebGL } from "./WebglHelper";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { BufferedGeometry } from "geometry/BufferedGeometry";
import { Attribute } from "geometry/attribute/Attribute";

export class VertexBuffer {
    public attributes: Attribute[];
    public buffers: WebGLBuffer[];
    public VAO!: WebGLVertexArrayObject;
    public readonly references: ReferenceCounter;
    public stride: number = 0;

    public constructor(gl: WebGL2RenderingContext, geometry: BufferedGeometry) {
        this.attributes = geometry.attributes;
        this.references = new ReferenceCounter();
        this.buffers = [];
        this.VAO = gl.createVertexArray()!;
        this.constructFromBufferedGeometry(gl, geometry);
    }

    private constructFromBufferedGeometry(gl: WebGL2RenderingContext, geometry: BufferedGeometry): void {
        gl.bindVertexArray(this.VAO);

        //Turn the geometry buffer into WebGLBuffers
        for (const buffer of geometry.buffers) {
            //NOTE: commented out because I think its dead code
            //Need to add buffer for index_buffer to not mess up indexing
            // if (buffer.target === gl.ELEMENT_ARRAY_BUFFER && geometry.index_buffer !== undefined) {
            //     this.buffers.push(gl.createBuffer()!);
            //     continue;
            // }
            const b = WebGL.buildBuffer(gl, buffer.target, buffer.buffer);
            this.buffers.push(b);
        }

        this.setupVAOBuffers(gl);
        gl.bindVertexArray(null);
    }

    public setupVAOBuffers(gl: WebGL2RenderingContext): void {
        let bound_buffer = undefined;
        let i = 0;
        for (const attrib of this.attributes) {
            if (!attrib.enabled) continue;
            //Bind correct buffer
            if (this.buffers[attrib.buffer_index] !== bound_buffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[attrib.buffer_index]);
                bound_buffer = this.buffers[attrib.buffer_index];
            }

            gl.enableVertexAttribArray(i);
            gl.vertexAttribPointer(
                i,
                attrib.component_count,
                attrib.component_type,
                attrib.normalized ?? false,
                attrib.byte_stride ?? 0,
                attrib.byte_offset ?? 0
            );
            i++;
        }
    }

    public updateBufferData(gl: WebGL2RenderingContext, geometry: BufferedGeometry): void {
        gl.bindVertexArray(this.VAO);

        for (const [index, buffer] of geometry.buffers.entries()) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[index]);
            gl.bufferData(buffer.target, buffer.buffer, gl.STATIC_DRAW);
        }
        // this.setupVAOBuffers(gl);
        gl.bindVertexArray(null);
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

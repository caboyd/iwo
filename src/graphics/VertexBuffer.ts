import { Attributes, typeToComponentCount } from "geometry/attribute/Attribute";
import { BufferedGeometry } from "geometry/BufferedGeometry";
import { ReferenceCounter } from "helpers/ReferenceCounter";
import { Shader } from "./shader/Shader";
import { WebGL } from "./WebglHelper";

export class VertexBuffer {
    public attributes: Attributes;
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
            const b = WebGL.buildBuffer(gl, buffer.target, buffer.buffer);
            this.buffers.push(b);
        }
        gl.bindVertexArray(null);
    }

    public setupVAO(gl: WebGL2RenderingContext, program: Shader): void {
        gl.bindVertexArray(this.VAO);

        let bound_buffer = undefined;
        let i = 0;

        const num_attribs = gl.getProgramParameter(program.ID, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < num_attribs; ++i) {
            const info = gl.getActiveAttrib(program.ID, i)!;
            const attrib = this.attributes[info.name];
            if (!attrib || !attrib.enabled) continue;
            const index = gl.getAttribLocation(program.ID, info.name);
            if (this.buffers[attrib.buffer_index] !== bound_buffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[attrib.buffer_index]);
                bound_buffer = this.buffers[attrib.buffer_index];
            }

            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(
                index,
                typeToComponentCount(info.type),
                attrib.component_type,
                attrib.normalized,
                attrib.byte_stride,
                attrib.byte_offset
            );
        }
        gl.bindVertexArray(null);
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

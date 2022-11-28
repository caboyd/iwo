import { TypedArray } from "@customtypes/types";
import { Attribute, Attributes, typeToComponentCount } from "@graphics/attribute/Attribute";
import { ReferenceCounter } from "@helpers/ReferenceCounter";
import { Shader } from "./shader/Shader";
import { WebGL } from "./WebglHelper";
import { Geometry } from "../geometry/Geometry";

export class VertexBuffer {
    public attributes: Record<string, Attribute>;
    public buffers: WebGLBuffer[];
    public VAO!: WebGLVertexArrayObject;
    public readonly references: ReferenceCounter;
    public stride: number = 0;

    public constructor(gl: WebGL2RenderingContext, attributes: Record<string, Attribute>, buffers: TypedArray[]) {
        this.attributes = attributes;
        this.references = new ReferenceCounter();
        this.buffers = [];
        this.VAO = gl.createVertexArray()!;
        this.constructFromBuffers(gl, buffers);
    }

    private constructFromBuffers(gl: WebGL2RenderingContext, buffers: TypedArray[]): void {
        //Turn the geometry buffer into WebGLBuffers
        for (const buffer of buffers) {
            const b = WebGL.buildBuffer(gl, gl.ARRAY_BUFFER, buffer);
            this.buffers.push(b);
        }
    }

    public setupVAO(gl: WebGL2RenderingContext, program: Shader): void {
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
            if (WebGL.isComponentTypeInteger(attrib.component_type))
                gl.vertexAttribIPointer(
                    index,
                    typeToComponentCount(info.type),
                    attrib.component_type,
                    attrib.byte_stride,
                    attrib.byte_offset
                );
            else
                gl.vertexAttribPointer(
                    index,
                    typeToComponentCount(info.type),
                    attrib.component_type,
                    attrib.normalized,
                    attrib.byte_stride,
                    attrib.byte_offset
                );

            if (attrib.divisor) {
                gl.vertexAttribDivisor(index, attrib.divisor);
            }
        }
    }

    public bufferSubData(gl: WebGL2RenderingContext, index: number, data: TypedArray): void {
        this.bind(gl);
        const buffer = this.buffers[index];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    }

    public bind(gl: WebGL2RenderingContext): void {
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

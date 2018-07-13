import { IndexBuffer } from "./IndexBuffer";
import { VertexBuffer } from "./VertexBuffer";
import { Shader } from "../renderers/Shader";

export class Renderer {
    gl: WebGL2RenderingContext;
    current_vertex_buffer: VertexBuffer | undefined;
    current_index_buffer: IndexBuffer | undefined;
    current_shader: Shader | undefined;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    public draw(
        draw_mode: number,
        count: number,
        offset: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        shader: Shader
    ): void {
        if (shader != this.current_shader) {
            this.current_shader = shader;
            this.current_shader.use();
        }

        if (vertex_buffer != this.current_vertex_buffer) {
            this.current_vertex_buffer = vertex_buffer;
            this.current_vertex_buffer.bindBuffers(this.gl);
        }

        if (index_buffer && index_buffer != this.current_index_buffer) {
            this.current_index_buffer = index_buffer;
            this.current_index_buffer.bind(this.gl);
        }

        if (index_buffer) {
            if (index_buffer.indices.BYTES_PER_ELEMENT === 2)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_SHORT, offset);
            else if (index_buffer.indices.BYTES_PER_ELEMENT === 4)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_INT, offset);
            else throw "Unknown index buffer type";
        } else {
            this.gl.drawArrays(draw_mode, offset, count);
        }
    }
}

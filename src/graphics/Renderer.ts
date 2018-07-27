import { IndexBuffer } from "./IndexBuffer";
import { VertexBuffer } from "./VertexBuffer";
import { Shader } from "./Shader";
import {mat4} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {PBRShader} from "./PBRShader";

export class Renderer {
    gl: WebGL2RenderingContext;
    current_vertex_buffer: VertexBuffer | undefined;
    current_index_buffer: IndexBuffer | undefined;
    current_shader: Shader | undefined;

    private static _EMPTY_TEXTURE:WebGLTexture;
    private static _PBRShader:PBRShader;
    private static _NormalOnlyShader:Shader;
    private static _GridShader:Shader;
    
    private uboGlobalBlock:WebGLBuffer;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        Renderer._EMPTY_TEXTURE = new Texture2D(gl,null).texture_id;
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        
        Renderer._PBRShader = new PBRShader(gl);
        Renderer._GridShader = new Shader(gl,
            require("src/shaders/grid.vert"), require("src/shaders/grid.frag"));
        Renderer._NormalOnlyShader = new Shader(gl,
            require("src/shaders/standard.vert"), require("src/shaders/normals.frag"));
        
        
        this.uboGlobalBlock = gl.createBuffer()!;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboGlobalBlock);
        gl.bufferData(gl.UNIFORM_BUFFER, 192, gl.STATIC_DRAW);
    }
    
    public setPerFrameUniforms(view:mat4, proj:mat4):void{
        
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

    static get EMPTY_TEXTURE() :WebGLTexture{
        return this._EMPTY_TEXTURE;
    }
    
    static get PBRShader(): PBRShader{
        return this._PBRShader;
    }
    
    static get GridShader():Shader{
        return this._GridShader;
    }
    
    static get NormalOnlyShader():Shader{
        return this._NormalOnlyShader;
    }
}

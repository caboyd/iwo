import { IndexBuffer } from "./IndexBuffer";
import { VertexBuffer } from "./VertexBuffer";
import { Shader } from "./Shader";
import {mat3, mat4} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {PBRShader} from "./PBRShader";
import {UniformBuffer} from "./UniformBuffer";

let temp:mat4 = mat4.create();

let modelview_matrix: mat4 = mat4.create();
let normalview_matrix: mat3 = mat3.create();
let mvp_matrix: mat4 = mat4.create();

export class Renderer {
    gl: WebGL2RenderingContext;
    current_vertex_buffer: VertexBuffer | undefined;
    current_index_buffer: IndexBuffer | undefined;
    current_shader: Shader | undefined;

    private static _EMPTY_TEXTURE:WebGLTexture;
    private static _PBRShader:PBRShader;
    private static _NormalOnlyShader:Shader;
    private static _GridShader:Shader;
    
    private uboGlobalBlock:UniformBuffer;
    private uboModelBlock:UniformBuffer;

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
        
        this.uboGlobalBlock = new UniformBuffer(Renderer._PBRShader,"ubo_per_frame");
        this.uboGlobalBlock.bindShader(Renderer._PBRShader,0);
        this.uboGlobalBlock.bindShader(Renderer._GridShader,0);
        this.uboGlobalBlock.bindShader(Renderer._NormalOnlyShader,0);
        
        this.uboModelBlock = new UniformBuffer(Renderer._PBRShader,"ubo_per_model");
        this.uboModelBlock.bindShader(Renderer._PBRShader,1);
        this.uboModelBlock.bindShader(Renderer._GridShader,1);
        this.uboModelBlock.bindShader(Renderer._NormalOnlyShader,1);
    }
    
    public setPerFrameUniforms(view:mat4, proj:mat4):void{
        this.uboGlobalBlock.set("view", view);
        this.uboGlobalBlock.set("projection", proj);
        this.uboGlobalBlock.set("view_projection", mat4.mul(temp,proj,view));
        this.uboGlobalBlock.update(this.gl);
    }

    public setPerModelUniforms(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4):void{
        this.uboModelBlock.set("model_view", mat4.mul(modelview_matrix,view_matrix,model_matrix));
        
        //NOTE: Does this buf if normalFromMat4 returns null?
        this.uboModelBlock.set("normal_view", mat3.normalFromMat4(normalview_matrix,modelview_matrix)!);
        
        this.uboModelBlock.set("mvp", mat4.mul(mvp_matrix,proj_matrix,modelview_matrix));
        this.uboModelBlock.update(this.gl);
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

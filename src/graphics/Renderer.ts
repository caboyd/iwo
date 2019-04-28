import {IndexBuffer} from "./IndexBuffer";
import {VertexBuffer} from "./VertexBuffer";
import {Shader} from "./shader/Shader";
import {mat3, mat4} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {UniformBuffer} from "./UniformBuffer";
import {Material} from "../materials/Material";
import {RendererStats} from "./RendererStats";
import {TextureCubeMap} from "./TextureCubeMap";
import {ShaderSource, ShaderSources} from "./shader/ShaderSources";


let temp: mat4 = mat4.create();

let modelview_matrix: mat4 = mat4.create();
let normalview_matrix: mat3 | null = mat3.create();
let mvp_matrix: mat4 = mat4.create();

export class ViewportDimensions {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
}

export class Renderer {
    readonly gl: WebGL2RenderingContext;
    private current_vertex_buffer: VertexBuffer | undefined;
    private current_index_buffer: IndexBuffer | undefined;
    private current_material: Material | undefined;
    private current_shader: Shader | undefined;

    private static _EMPTY_TEXTURE: WebGLTexture;
    private static _EMPTY_CUBE_TEXTURE: WebGLTexture;
    private static _BRDF_LUT_TEXTURE: WebGLTexture | undefined;
    private static _Shaders: Map<string, Shader>;

    private readonly PerFrameBinding = 0;
    private readonly ModelBinding = 1;
    private uboPerFrameBlock: UniformBuffer;
    private uboPerModelBlock: UniformBuffer;

    private stats: RendererStats;

    public viewport: ViewportDimensions = new ViewportDimensions();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.stats = new RendererStats();


        Renderer._EMPTY_TEXTURE = new Texture2D(gl).texture_id;
        Renderer._EMPTY_CUBE_TEXTURE = new TextureCubeMap(gl).texture_id;

        Renderer._Shaders = new Map<string, Shader>();

        for (let shader_source of ShaderSources) {
            if (shader_source.subclass !== undefined) {
                Renderer._Shaders.set(shader_source.name, new shader_source.subclass(gl, shader_source.vert, shader_source.frag));
            } else {
                Renderer._Shaders.set(shader_source.name, new Shader(gl, shader_source.vert, shader_source.frag));
            }
        }

        let shader = Renderer.GetShader(ShaderSource.PBR.name)!;
        //Requires shader that has these uniform buffers present
        this.uboPerFrameBlock = new UniformBuffer(shader, "ubo_per_frame");
        this.uboPerModelBlock = new UniformBuffer(shader, "ubo_per_model");
        for (let shader of Renderer._Shaders.values()) {
            this.uboPerFrameBlock.bindShader(shader, this.PerFrameBinding);
            this.uboPerModelBlock.bindShader(shader, this.ModelBinding);
        }
    }

    public setPerFrameUniforms(view: mat4, proj: mat4): void {
        this.uboPerFrameBlock.set("view", view);
        this.uboPerFrameBlock.set("view_inverse", mat4.invert(temp,view)!);
        this.uboPerFrameBlock.set("projection", proj);
        this.uboPerFrameBlock.set("view_projection", mat4.mul(temp, proj, view));
        this.uboPerFrameBlock.update(this.gl);

        //console.dir(this.stats);
        this.resetStats();
    }

    //Note: Setting Uniform blocks per draw call is not the best way.
    //A single uniform block for all objects to be drawn should be used and set once per frame.
    public setPerModelUniforms(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4): void {
        this.uboPerModelBlock.set("model_view", mat4.mul(modelview_matrix, view_matrix, model_matrix));

        //NOTE: Does this bug if normalFromMat4 returns null?
        normalview_matrix = mat3.normalFromMat4(normalview_matrix!, modelview_matrix);
        if (!normalview_matrix)
            throw new Error("Determinant could not be calculated for normalview_matrix");

        this.uboPerModelBlock.set("normal_view", mat3.normalFromMat4(normalview_matrix, modelview_matrix)!);

        this.uboPerModelBlock.set("mvp", mat4.mul(mvp_matrix, proj_matrix, modelview_matrix));
        this.uboPerModelBlock.update(this.gl);
    }

    public setViewport(x: number, y: number, width: number, height: number) {
        this.viewport = {x, y, width, height};
        this.gl.viewport(x, y, width, height);
    }

    public draw(
        draw_mode: number,
        count: number,
        offset: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        mat: Material | undefined = undefined
    ): void {
        if (mat && mat.shader != this.current_shader) {
            this.current_shader = mat.shader;
            this.current_shader.use();
            this.stats.shader_bind_count++;
        }

        if (mat && mat != this.current_material) {
            this.current_material = mat;
            this.current_material.activate(this.gl);
            this.stats.material_bind_count++;
        }

        if (vertex_buffer != this.current_vertex_buffer) {
            this.current_vertex_buffer = vertex_buffer;
            this.current_vertex_buffer.bindBuffers(this.gl);
            this.stats.vertex_buffer_bind_count++;
        }

        if (index_buffer && index_buffer != this.current_index_buffer) {
            this.current_index_buffer = index_buffer;
            this.current_index_buffer.bind(this.gl);
            this.stats.index_buffer_bind_count++;
        }

        if (index_buffer) {
            if (index_buffer.indices.BYTES_PER_ELEMENT === 2)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_SHORT, offset);
            else if (index_buffer.indices.BYTES_PER_ELEMENT === 4)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_INT, offset);
            else throw new Error("Unknown index buffer type");
            this.stats.index_draw_count += count;
        } else {
            this.gl.drawArrays(draw_mode, offset, count);
            this.stats.vertex_draw_count += count;
        }

        this.stats.draw_calls++;
    }

    public resetStats(): void {
        //console.dir(this.stats);
        this.stats.reset();
        this.current_shader = undefined;
        this.current_material = undefined;
    }

    static get EMPTY_TEXTURE(): WebGLTexture {
        return this._EMPTY_TEXTURE;
    }

    static get EMPTY_CUBE_TEXTURE(): WebGLTexture {
        return this._EMPTY_CUBE_TEXTURE;
    }

    static get BRDF_LUT_TEXTURE(): WebGLTexture | undefined {
            return this._BRDF_LUT_TEXTURE;
    }
    
    static set BRDF_LUT_TEXTURE(tex:WebGLTexture | undefined){
        this._BRDF_LUT_TEXTURE = tex;
    }

    static GetShader(name: string): Shader | undefined {
        return this._Shaders.get(name);
    }

}


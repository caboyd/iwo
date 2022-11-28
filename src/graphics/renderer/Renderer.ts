import { mat3, mat4 } from "gl-matrix";
import { Material } from "@materials/Material";
import { IndexBuffer } from "../IndexBuffer";
import { RendererStats } from "./RendererStats";
import { Shader } from "../shader/Shader";
import { ShaderSource } from "../shader/ShaderSources";
import { Texture2D } from "../textures/Texture2D";
import { TextureCubeMap } from "../textures/TextureCubeMap";
import { UniformBuffer } from "../UniformBuffer";
import { VertexBuffer } from "../VertexBuffer";

const temp: mat4 = mat4.create();

const modelview_matrix: mat4 = mat4.create();
const normalview_matrix: mat3 = mat3.create();
const mvp_matrix: mat4 = mat4.create();
const BIAS_MATRIX = mat4.fromValues(0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5, 0, 0.5, 0.5, 0.5, 1);

export class ViewportDimensions {
    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;
}

export class Renderer {
    public readonly gl: WebGL2RenderingContext;
    private current_material: Material | undefined;
    private current_shader: Shader | undefined;

    private static _EMPTY_TEXTURE: WebGLTexture;
    private static _EMPTY_CUBE_TEXTURE: WebGLTexture;
    private static _BRDF_LUT_TEXTURE: WebGLTexture | undefined;
    private __Shaders: Map<string, Shader>;

    private readonly PerFrameBinding = 0;
    private readonly PerModelBinding = 1;
    private uboPerFrameBlock: UniformBuffer;
    private uboPerModelBlock: UniformBuffer;

    private stats: RendererStats;

    public viewport: ViewportDimensions = new ViewportDimensions();

    public constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.stats = new RendererStats();
        this.__Shaders = new Map<string, Shader>();

        Renderer._EMPTY_TEXTURE = new Texture2D(gl).texture_id;
        Renderer._EMPTY_CUBE_TEXTURE = new TextureCubeMap(gl).texture_id;

        const shader = this.getorCreateShader(ShaderSource.PBR);
        //Requires shader that has these uniform buffers present
        this.uboPerFrameBlock = new UniformBuffer(shader, "ubo_per_frame");
        this.uboPerModelBlock = new UniformBuffer(shader, "ubo_per_model");
        this.uboPerFrameBlock.bindShader(shader, this.PerFrameBinding);
        this.uboPerModelBlock.bindShader(shader, this.PerModelBinding);
    }

    public setPerFrameUniforms(view: mat4, proj: mat4, shadow_map?: mat4): void {
        this.uboPerFrameBlock.set("view", view);
        this.uboPerFrameBlock.set("view_inverse", mat4.invert(temp, view));
        this.uboPerFrameBlock.set("projection", proj);
        this.uboPerFrameBlock.set("view_projection", mat4.mul(temp, proj, view));
        if (shadow_map) this.uboPerFrameBlock.set("shadow_map_space", mat4.mul(temp, BIAS_MATRIX, shadow_map));
        this.uboPerFrameBlock.update(this.gl);

        //console.dir(this.stats);
        this.resetStats();
    }

    //Note: Setting Uniform blocks per draw call is not the best way.
    //A single uniform block for all objects to be drawn should be used and set once per frame.
    public setPerModelUniforms(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4): void {
        this.uboPerModelBlock.set("model", model_matrix);
        mat3.normalFromMat4(normalview_matrix, mat4.multiply(modelview_matrix, view_matrix, model_matrix));
        this.uboPerModelBlock.set("normal_view", normalview_matrix);
        this.uboPerModelBlock.set("mvp", mat4.mul(mvp_matrix, proj_matrix, modelview_matrix));
        this.uboPerModelBlock.update(this.gl);
    }

    public prepareMaterialShaders(materials: Material[]) {
        for (const mat of materials) {
            if (this.__Shaders.has(mat.shaderSource.name)) continue;
            else this.initShader(mat.shaderSource);
        }
    }

    public setAndActivateShader(shader: Shader) {
        this.current_shader = shader;
        this.current_shader.use();
        this.stats.shader_bind_count++;
    }

    public getorCreateShader(src: ShaderSource): Shader {
        let shader = this.__Shaders.get(src.name)!;
        if (shader === undefined) shader = this.initShader(src);
        return shader;
    }

    private initShader(src: ShaderSource): Shader {
        let current_shader;
        if (src.subclass !== undefined) {
            current_shader = new src.subclass(this.gl, src.vert, src.frag);
            this.__Shaders.set(src.name, current_shader);
        } else {
            current_shader = new Shader(this.gl, src.vert, src.frag);
            this.__Shaders.set(src.name, current_shader);
        }
        if (this.uboPerFrameBlock && this.uboPerModelBlock) {
            this.uboPerFrameBlock.bindShader(current_shader, this.PerFrameBinding);
            this.uboPerModelBlock.bindShader(current_shader, this.PerModelBinding);
        }
        return current_shader;
    }

    public setViewport(x: number, y: number, width: number, height: number): void {
        this.viewport = { x, y, width, height };
        this.gl.viewport(x, y, width, height);
    }

    public resetViewport(): void {
        this.gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
    }

    public resetSaveBindings(): void {
        this.current_material = undefined;
        this.current_shader = undefined;
    }

    public draw(
        draw_mode: number,
        count: number,
        offset: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        mat: Material | undefined = undefined
    ): void {
        this.prepareDraw(mat, vertex_buffer, index_buffer);

        if (index_buffer) {
            this.gl.drawElements(draw_mode, count, index_buffer.type, offset);
            this.stats.index_draw_count += count;
        } else {
            this.gl.drawArrays(draw_mode, offset, count);
            this.stats.vertex_draw_count += count;
        }
        this.stats.draw_calls++;
        this.gl.bindVertexArray(null);
    }

    public drawInstanced(
        draw_mode: number,
        count: number,
        offset: number,
        instance_count: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        mat: Material | undefined = undefined
    ): void {
        this.prepareDraw(mat, vertex_buffer, index_buffer);

        if (index_buffer) {
            this.gl.drawElementsInstanced(draw_mode, count, index_buffer.type, offset, instance_count);
            this.stats.index_draw_count += count;
        } else {
            this.gl.drawArraysInstanced(draw_mode, offset, count, instance_count);
            this.stats.vertex_draw_count += count;
        }
        this.stats.draw_calls++;
        this.gl.bindVertexArray(null);
    }

    private prepareDraw(mat: Material | undefined, vertex_buffer: VertexBuffer, index_buffer: IndexBuffer | undefined) {
        const shader = mat && this.getorCreateShader(mat?.shaderSource);

        if (shader && shader != this.current_shader) {
            this.current_shader = shader;
            this.current_shader.use();
            this.stats.shader_bind_count++;
        }

        if (mat && mat != this.current_material) {
            if (mat.cleanupGLState) mat.cleanupGLState(this.gl);
            this.current_material = mat;
            if (this.current_shader === undefined) throw "No shader bound with material";
            this.current_material.activate(this.gl, this.current_shader);
            this.stats.material_bind_count++;
        }

        vertex_buffer.bind(this.gl);
        this.stats.vertex_buffer_bind_count++;
    }

    public cleanupGLState(): void {
        if (this.current_material && this.current_material.cleanupGLState)
            this.current_material.cleanupGLState(this.gl);
    }

    public resetStats(): void {
        this.stats.reset();
    }

    public static get EMPTY_TEXTURE(): WebGLTexture {
        return this._EMPTY_TEXTURE;
    }

    public static get EMPTY_CUBE_TEXTURE(): WebGLTexture {
        return this._EMPTY_CUBE_TEXTURE;
    }

    public static get BRDF_LUT_TEXTURE(): WebGLTexture | undefined {
        return this._BRDF_LUT_TEXTURE;
    }

    public static set BRDF_LUT_TEXTURE(tex: WebGLTexture | undefined) {
        this._BRDF_LUT_TEXTURE = tex;
    }
}
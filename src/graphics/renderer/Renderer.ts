import { Material } from "@materials/Material";
import { mat3, mat4 } from "gl-matrix";
import { IndexBuffer } from "../IndexBuffer";
import { Shader } from "../shader/Shader";
import { ShaderSource } from "../shader/ShaderSources";
import { Texture2D } from "../textures/Texture2D";
import { TextureCubeMap } from "../textures/TextureCubeMap";
import { UniformBuffer } from "../UniformBuffer";
import { VertexBuffer } from "../VertexBuffer";
import { RendererStats } from "./RendererStats";

const mat4_temp: mat4 = mat4.create();
const mat3_temp: mat3 = mat3.create();
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
    #shaders: Map<string, Shader>;

    private readonly PerFrameBinding = 0;
    private readonly PerModelBinding = 1;
    private uboPerFrameBlock: UniformBuffer;
    private uboPerModelBlock: UniformBuffer;

    public stats: RendererStats;

    #view_port_changed: boolean = false;
    public viewport: ViewportDimensions;

    #global_defines: ShaderSource.Define_Flags = 0;
    #shader_variant_uniforms: Map<string, Map<string, any>>;

    public constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.stats = new RendererStats();
        this.#shaders = new Map<string, Shader>();
        this.viewport = { x: 0, y: 0, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
        this.#shader_variant_uniforms = new Map();

        Renderer._EMPTY_TEXTURE = new Texture2D(gl).texture_id;
        Renderer._EMPTY_CUBE_TEXTURE = new TextureCubeMap(gl).texture_id;

        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) throw "Your browser does not support Webgl2:EXT_color_buffer_float";

        const shader = this.getorCreateShader(ShaderSource.PBR);
        //Requires shader that has these uniform buffers present
        this.uboPerFrameBlock = new UniformBuffer(shader, "ubo_per_frame");
        this.uboPerModelBlock = new UniformBuffer(shader, "ubo_per_model");
        this.uboPerFrameBlock.bindShader(shader, this.PerFrameBinding);
        this.uboPerModelBlock.bindShader(shader, this.PerModelBinding);
    }

    public setShadows(enabled: boolean) {
        if (enabled) this.#global_defines |= ShaderSource.Define_Flags.SHADOWS;
        else this.#global_defines |= ~ShaderSource.Define_Flags.SHADOWS;
    }

    public setPerFrameUniform(
        name: "view" | "view_inverse" | "view_projection" | "projection" | "shadow_map_space",
        mat: mat4
    ): void {
        if (name === "shadow_map_space")
            this.uboPerFrameBlock.set("shadow_map_space", mat4.mul(mat4_temp, BIAS_MATRIX, mat));
        else this.uboPerFrameBlock.set(name, mat);
    }

    public setPerFrameUniforms(view: mat4, proj: mat4, shadow_map?: mat4): void {
        mat4.invert(mat4_temp, view);
        this.uboPerFrameBlock.set("camera", [mat4_temp[12], mat4_temp[13], mat4_temp[14]]);
        this.uboPerFrameBlock.set("view", view);
        this.uboPerFrameBlock.set("projection", proj);
        if (shadow_map) this.uboPerFrameBlock.set("shadow_map_space", mat4.mul(mat4_temp, BIAS_MATRIX, shadow_map));
        this.uboPerFrameBlock.update(this.gl);

        //console.dir(this.stats);
        this.resetStats();
    }

    //Note: Setting Uniform blocks per draw call is not the best way.
    //A single uniform block for all objects to be drawn should be used and set once per frame.
    public setPerModelUniforms(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4): void {
        this.uboPerModelBlock.set("model", model_matrix);
        mat3.normalFromMat4(mat3_temp, model_matrix);
        this.uboPerModelBlock.set("model_inverse", mat3_temp);
        this.uboPerModelBlock.update(this.gl);
    }

    public prepareMaterialShaders(materials: Material[], defines?: ShaderSource.Define_Flags) {
        for (const mat of materials) {
            const name = ShaderSource.toShaderNameWithDefines(mat.shaderSource, defines);
            if (this.#shaders.has(name)) continue;
            else {
                const source = ShaderSource.toShaderSourceWithDefines(mat.shaderSource, defines);
                this.initShader(source);
            }
        }
    }

    public setAndActivateShader(shader: Shader) {
        this.current_shader = shader;
        this.current_shader.use();
        this.stats.shader_bind_count++;
    }

    public overwriteShaderVariantUniforms(source: ShaderSource, uniforms: Map<string, any>) {
        this.#shader_variant_uniforms.set(source.name, uniforms);

        //loop through all variant shaders with same base and set uniforms
        for (const [name, shader] of this.#shaders) {
            if (name.includes(source.name)) shader.setUniforms(uniforms);
        }
    }

    public addShaderVariantUniforms(source: ShaderSource, uniforms: Map<string, any>) {
        const existing_uniforms = this.#shader_variant_uniforms.get(source.name);

        if (!existing_uniforms) {
            this.overwriteShaderVariantUniforms(source, uniforms);
            return;
        } else {
            //loop through all variant shaders with same base and set uniforms
            for (const [name, shader] of this.#shaders) {
                shader.use();
                if (name.includes(source.name)) shader.setUniforms(uniforms);
            }
            //update existing saved uniforms
            const merged = new Map([...existing_uniforms, ...uniforms]);
            this.#shader_variant_uniforms.set(source.name, merged);
        }
    }

    public addShaderVariantUniform(source: ShaderSource, uniform_name: string, value: any) {
        const existing_uniforms = this.#shader_variant_uniforms.get(source.name);

        if (!existing_uniforms) {
            this.overwriteShaderVariantUniforms(source, new Map().set(uniform_name, value));
            return;
        } else {
            //loop through all variant shaders with same base and set uniforms
            for (const [name, shader] of this.#shaders) {
                shader.use();
                if (name.includes(source.name)) shader.setUniform(uniform_name, value);
            }
            //update existing saved uniforms
            existing_uniforms.set(uniform_name, value);
        }
    }

    public getorCreateShader(src: ShaderSource, defines: ShaderSource.Define_Flags = 0): Shader {
        let combined_defines: ShaderSource.Define_Flags = this.#global_defines | defines;
        const name = ShaderSource.toShaderNameWithDefines(src, combined_defines);
        let shader = this.#shaders.get(name);
        if (shader === undefined) {
            const source = ShaderSource.toShaderSourceWithDefines(src, combined_defines);
            shader = this.initShader(source);
        }
        return shader;
    }

    private initShader(src: ShaderSource): Shader {
        let shader = new Shader(this.gl, src.vert, src.frag);
        shader.use();
        this.current_shader = shader;
        shader.setUniformsRecord(src.intial_uniforms);
        this.#shaders.set(src.name, shader);

        //set any preset uniforms that have be set for this shader base
        const shader_base_name = src.name.split("#")[0];
        const uniforms = this.#shader_variant_uniforms.get(shader_base_name);
        if (uniforms) shader.setUniforms(uniforms);

        //set ubos
        if (this.uboPerFrameBlock && this.uboPerModelBlock) {
            this.uboPerFrameBlock.bindShader(shader, this.PerFrameBinding);
            this.uboPerModelBlock.bindShader(shader, this.PerModelBinding);
        }
        return shader;
    }

    public viewPortHasChanged(): boolean {
        return this.#view_port_changed;
    }

    public setViewport(x: number, y: number, width: number, height: number): void {
        if (
            this.viewport.x !== x ||
            this.viewport.y !== y ||
            this.viewport.width !== width ||
            this.viewport.height !== height
        ) {
            this.viewport = { x, y, width, height };
            this.gl.viewport(x, y, width, height);
            this.#view_port_changed = true;
        }
    }

    public resetViewport(): void {
        const v: Int32Array = this.gl.getParameter(this.gl.VIEWPORT);
        //untested
        if (
            this.viewport.x !== v[0] ||
            this.viewport.y !== v[1] ||
            this.viewport.width !== v[2] ||
            this.viewport.height !== v[3]
        ) {
            this.gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
            this.#view_port_changed = true;
        }
    }

    public resetSaveBindings(): void {
        this.cleanupPrevMaterialState();
        this.current_material = undefined;
        this.current_shader = undefined;
    }

    public draw(
        draw_mode: number,
        count: number,
        offset: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        mat: Material | undefined = undefined,
        defines?: ShaderSource.Define_Flags
    ): void {
        this.prepareDraw(mat, vertex_buffer, defines);

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
        mat: Material | undefined = undefined,
        defines?: ShaderSource.Define_Flags
    ): void {
        this.prepareDraw(mat, vertex_buffer, defines);

        if (index_buffer) {
            this.gl.drawElementsInstanced(draw_mode, count, index_buffer.type, offset, instance_count);
            this.stats.index_draw_count += count * instance_count;
        } else {
            this.gl.drawArraysInstanced(draw_mode, offset, count, instance_count);
            this.stats.vertex_draw_count += count * instance_count;
        }
        this.stats.draw_calls++;
        this.gl.bindVertexArray(null);
    }

    private prepareDraw(mat: Material | undefined, vertex_buffer: VertexBuffer, defines?: ShaderSource.Define_Flags) {
        const shader = mat && this.getorCreateShader(mat?.shaderSource, defines);

        if (shader && shader != this.current_shader) {
            this.current_shader = shader;
            this.current_shader.use();
            this.stats.shader_bind_count++;
        }

        if (mat && mat != this.current_material) {
            this.current_material = mat;
            if (this.current_shader === undefined) throw "No shader bound with material";
            this.current_material.activate(this.gl, this.current_shader);
            this.stats.material_bind_count++;
        }

        vertex_buffer.bind(this.gl);
        this.stats.vertex_buffer_bind_count++;

        //lock in viewport change
        this.#view_port_changed = false;
    }

    public cleanupPrevMaterialState(): void {
        if (this.current_material && this.current_material.cleanup) this.current_material.cleanup(this.gl);
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

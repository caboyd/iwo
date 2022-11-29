import { QuadGeometry } from "@geometry/QuadGeometry";
import { Shader } from "@graphics/shader/Shader";
import { Mesh } from "@meshes/Mesh";
import { MeshInstance } from "@meshes/MeshInstance";
import { mat4 } from "gl-matrix";
import { ShaderSource } from "../shader/ShaderSources";
import { Texture2D } from "../textures/Texture2D";
import { Renderer } from "./Renderer";

interface RenderCommand {
    mesh_instance: MeshInstance;
    onBeforeRender?: () => void;
    onAfterRender?: () => void;
}

interface RenderPass {
    //frame_buffer: WebGLFramebuffer;
    //render_buffer: WebGLRenderbuffer;
    onBeforePass?: () => void;
    onAfterPass?: () => void;
    readonly setupPass: () => void;
    readonly teardownPass: () => void;

    render_command_list: RenderCommand[];
    view_matrix: mat4;
    proj_matrix: mat4;
    //output_texture: Texture2D;
}

interface PostProcessPass {
    onBeforePass?: () => void;
    onAfterPass?: () => void;
}

interface PostProcessPass {
    //frame_buffer: WebGLFramebuffer;
    // render_buffer: WebGLRenderbuffer;
    shader: Shader;
    pre_pass_func?: () => void;
    post_pass_func?: () => void;
}

export class DefaultRenderPass implements RenderPass {
    onBeforePass?: (() => void) | undefined;
    onAfterPass?: (() => void) | undefined;
    readonly setupPass: () => void;
    readonly teardownPass: () => void;
    render_command_list: RenderCommand[];
    view_matrix: mat4;
    proj_matrix: mat4;

    /**
     *
     * @param renderer
     * @param view_matrix_ptr - matrix is not cloned so it is affected by changes
     * @param proj_matrix_ptr -  matrix is not cloned so it is affected by changes
     */
    constructor(renderer: Renderer, view_matrix_ptr: mat4, proj_matrix_ptr: mat4) {
        this.render_command_list = [];
        this.view_matrix = view_matrix_ptr;
        this.proj_matrix = proj_matrix_ptr;

        const pbr = renderer.getorCreateShader(ShaderSource.PBR);
        renderer.setAndActivateShader(pbr);
        pbr.setUniform("hdr_correction_disabled", true);
        const gl = renderer.gl;

        this.setupPass = () => {
            renderer.setPerFrameUniforms(this.view_matrix, this.proj_matrix);
        };
        this.teardownPass = () => {};
    }
}

export const HDR_Type_Const = ["Reinhard", "Reinhard2", "Lottes", "ACES", "Exposure", "Unreal"] as const;
export type HDR_Type = typeof HDR_Type_Const[number];

export class HDRCorrectionPostProcess implements PostProcessPass {
    onBeforePass?: (() => void) | undefined;
    onAfterPass?: (() => void) | undefined;
    pre_pass_func?: (() => void) | undefined;
    post_pass_func?: (() => void) | undefined;
    shader: Shader;

    constructor(renderer: Renderer, type: HDR_Type = HDR_Type_Const[0], gamma: number = 2.2) {
        this.shader = renderer.getorCreateShader(ShaderSource.HDR);
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("hdr_type", HDR_Type_Const.indexOf(type));
        this.shader.setUniform("gamma", gamma);
        this.shader.setUniform("exposure", 1.0);
    }

    public setHDR(renderer: Renderer, type: HDR_Type) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("hdr_type", HDR_Type_Const.indexOf(type));
    }

    public setGamma(renderer: Renderer, value: number) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("gamma", value);
    }
    public setExposure(renderer: Renderer, value: number) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("exposure", value);
    }
}

export class RendererQueue {
    public renderer: Renderer;
    public render_pass_index_map: Record<string, number>;
    public render_passes: RenderPass[];
    public post_processes_pass_index_map: Record<string, number>;
    public post_processes_passes: PostProcessPass[];
    private quad: Mesh;
    private width: number;
    private height: number;

    //ping pong buffers
    current_frame_buffer: number = 0;
    frame_buffers: [WebGLFramebuffer, WebGLFramebuffer];
    output_textures: [Texture2D, Texture2D];
    multisample_frame_buffer: WebGLFramebuffer;

    constructor(renderer: Renderer) {
        const gl = renderer.gl;
        this.renderer = renderer;
        this.render_passes = [];
        this.render_pass_index_map = {};
        this.post_processes_passes = [];
        this.post_processes_pass_index_map = {};

        const geom = new QuadGeometry();
        this.quad = new Mesh(gl, geom);

        this.frame_buffers = [gl.createFramebuffer()!, gl.createFramebuffer()!];
        this.width = renderer.viewport.width - renderer.viewport.x;
        this.height = renderer.viewport.height - renderer.viewport.y;
        const texture_settings = {
            width: this.width,
            height: this.height,
            type: gl.FLOAT,
            internal_format: gl.RGBA32F,
            format: gl.RGBA,
            wrap_S: gl.CLAMP_TO_EDGE,
            wrap_T: gl.CLAMP_TO_EDGE,
            min_filter: gl.LINEAR,
        };
        const buffer = new Float32Array(this.width * this.height * 4);
        this.output_textures = [
            new Texture2D(gl, buffer, texture_settings),
            new Texture2D(gl, buffer, texture_settings),
        ];

        for (let i = 0; i < 2; i++) {
            const ext = gl.getExtension("EXT_color_buffer_float");
            if (!ext) throw `EXT_color_buffer_float not available. Required for RenderPass.`;

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame_buffers[i]);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.output_textures[i].texture_id,
                0
            );
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        this.multisample_frame_buffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.multisample_frame_buffer);
        const color = gl.createRenderbuffer()!;
        gl.bindRenderbuffer(gl.RENDERBUFFER, color);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES),
            gl.RGBA32F,
            this.width,
            this.height
        );
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
        const depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES),
            gl.DEPTH_COMPONENT16,
            this.width,
            this.height
        );
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }

    public buildFrameBuffers(): void {
        const gl = this.renderer.gl;
        const renderer = this.renderer;
        this.width = renderer.viewport.width - renderer.viewport.x;
        this.height = renderer.viewport.height - renderer.viewport.y;
        const texture_settings = {
            width: this.width,
            height: this.height,
            type: gl.FLOAT,
            internal_format: gl.RGBA32F,
            format: gl.RGBA,
            wrap_S: gl.CLAMP_TO_EDGE,
            wrap_T: gl.CLAMP_TO_EDGE,
            min_filter: gl.LINEAR,
        };
        const buffer = new Float32Array(this.width * this.height * 4);

        this.output_textures = [
            new Texture2D(gl, buffer, texture_settings),
            new Texture2D(gl, buffer, texture_settings),
        ];

        this.frame_buffers = [gl.createFramebuffer()!, gl.createFramebuffer()!];
        for (let i = 0; i < 2; i++) {
            const ext = gl.getExtension("EXT_color_buffer_float");
            if (!ext) throw `EXT_color_buffer_float not available. Required for RenderPass.`;

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame_buffers[i]);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.output_textures[i].texture_id,
                0
            );
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        this.multisample_frame_buffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.multisample_frame_buffer);
        const color = gl.createRenderbuffer()!;
        gl.bindRenderbuffer(gl.RENDERBUFFER, color);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES),
            gl.RGBA32F,
            this.width,
            this.height
        );
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
        const depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            gl.getParameter(gl.MAX_SAMPLES),
            gl.DEPTH_COMPONENT16,
            this.width,
            this.height
        );
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }

    public updateViewPort(): void {
        const gl = this.renderer.gl;
        if (this.renderer.viewPortHasChanged()) {
            gl.deleteTexture(this.output_textures[0].texture_id);
            gl.deleteTexture(this.output_textures[1].texture_id);
            gl.deleteFramebuffer(this.frame_buffers[0]);
            gl.deleteFramebuffer(this.frame_buffers[1]);
            gl.deleteFramebuffer(this.multisample_frame_buffer);
            this.buildFrameBuffers();
        }
    }

    public getRenderPass(id: string): RenderPass {
        const index = this.render_pass_index_map[id];
        if (index === undefined) throw `RenderPass ${id} does not exist`;
        return this.render_passes[index];
    }

    public appendRenderPass(id: string, pass: RenderPass) {
        const l = this.render_passes.push(pass);
        this.render_pass_index_map[id] = l - 1;
    }

    public prependRenderPass(id: string, pass: RenderPass) {
        this.render_passes.unshift(pass);
        this.render_pass_index_map[id] = 0;
        for (const [s, i] of Object.entries(this.render_pass_index_map)) {
            this.render_pass_index_map[s] = i + 1;
        }
    }

    public getPostProcessPass(id: string): PostProcessPass {
        const index = this.post_processes_pass_index_map[id];
        if (index === undefined) throw `PostProcessPass ${id} does not exist`;
        return this.post_processes_passes[index];
    }

    public appendPostProcessPass(id: string, pass: PostProcessPass) {
        const l = this.post_processes_passes.push(pass);
        this.post_processes_pass_index_map[id] = l - 1;
    }

    public execute(): void {
        this.updateViewPort();
        const gl = this.renderer.gl;
        for (const pass of this.render_passes) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.multisample_frame_buffer);
            pass.setupPass();
            pass.onBeforePass?.();
            for (const command of pass.render_command_list) {
                command.onBeforeRender?.();
                command.mesh_instance.render(this.renderer, pass.view_matrix, pass.proj_matrix);
                command.onAfterRender?.();
            }
            pass.teardownPass();
            pass.onAfterPass?.();
            pass.render_command_list = [];
        }

        //blit multisample buffer
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.multisample_frame_buffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.frame_buffers[this.current_frame_buffer]);
        gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 0.0]);
        //prettier-ignore
        gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.LINEAR);

        //ping pong and post process
        for (let i = 0; i < this.post_processes_passes.length; i++) {
            const pass = this.post_processes_passes[i];
            const current_texture = this.current_frame_buffer;

            if (i === this.post_processes_passes.length - 1) {
                //last pass
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                this.current_frame_buffer = 1 - this.current_frame_buffer;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.current_frame_buffer);
            }
            pass.onBeforePass?.();
            this.renderer.setAndActivateShader(pass.shader);
            pass.shader.setUniform("input_texture", 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.output_textures[current_texture].texture_id);
            if (!this.quad.initialized) this.quad.setupVAO(gl, pass.shader);
            this.renderer.draw(this.quad.draw_mode, this.quad.count, 0, undefined, this.quad.vertex_buffer);
            pass.onAfterPass?.();
        }
        this.renderer.cleanupGLState();
    }

    public addCommandToRenderPass(id: string, command: RenderCommand): void {
        const index = this.render_pass_index_map[id];
        if (index === undefined) throw `RenderPass ${id} does not exist`;
        const pass = this.render_passes[index];
        pass.render_command_list.push(command);
    }

    public addCommandToAllPasses(command: RenderCommand): void {
        for (const pass of this.render_passes) pass.render_command_list.push(command);
    }

    public addMeshInstanceToRenderPass(id: string, instance: MeshInstance): void {
        const command: RenderCommand = {
            mesh_instance: instance,
        };
        this.addCommandToRenderPass(id, command);
    }

    public addMeshInstanceToAllPasses(instance: MeshInstance): void {
        const command: RenderCommand = {
            mesh_instance: instance,
        };
        for (const pass of this.render_passes) pass.render_command_list.push(command);
    }
}

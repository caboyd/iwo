import { ShaderSource } from "@graphics/shader/ShaderSources";
import { MeshInstance } from "@meshes/MeshInstance";
import { mat4 } from "gl-matrix";
import { Renderer } from "../Renderer";

export interface RenderCommand {
    mesh_instance: MeshInstance;
    onBeforeRender?: () => void;
    onAfterRender?: () => void;
}

export interface RenderPass {
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

        this.setDefaultTonemapping(renderer, false);

        this.setupPass = () => {
            renderer.setPerFrameUniforms(this.view_matrix, this.proj_matrix);
        };
        this.teardownPass = () => {};
    }

    public setDefaultTonemapping(renderer: Renderer, value: boolean) {
        renderer.addShaderVariantUniform(ShaderSource.PBR, "hdr_correction_disabled", !value);
    }
}

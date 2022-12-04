import { mat4 } from "gl-matrix";
import { Renderer } from "../Renderer";
import { RenderCommand, IRenderPass } from "./RenderPass";
import { Texture2D } from "../../textures/Texture2D";
import { EmptyMaterial } from "../../../materials/EmptyMaterial";
import { ShaderSource } from "@graphics/shader/ShaderSources";

export class DepthPass implements IRenderPass {
    onBeforePass?: (() => void) | undefined;
    onAfterPass?: (() => void) | undefined;
    readonly setupPass: () => void;
    readonly teardownPass: () => void;
    render_command_list: RenderCommand[];
    view_matrix: mat4;
    proj_matrix: mat4;
    override_material: EmptyMaterial;
    depth_texture_float: Texture2D;
    depth_texture_rgba?: Texture2D;
    private depth_frame_buffer: WebGLFramebuffer;
    private depth_texture_size: number;
    private shadow_map_space_matrix: mat4;

    /**
     *
     * @param renderer
     * @param light_view_matrix_ptr - matrix is not cloned so it is affected by changes
     * @param depth_proj_matrix_ptr -  matrix is not cloned so it is affected by changes
     */
    constructor(
        renderer: Renderer,
        light_view_matrix_ptr: mat4,
        depth_proj_matrix_ptr: mat4,
        depth_texture_size: number = 1024,
        shadow_distance: number = 28,
        shadow_fade_distance: number = 5,
        debug_render_rgba_texture: boolean = false
    ) {
        this.render_command_list = [];
        this.view_matrix = light_view_matrix_ptr;
        this.proj_matrix = depth_proj_matrix_ptr;
        this.depth_texture_size = depth_texture_size;
        this.shadow_map_space_matrix = mat4.mul(mat4.create(), this.proj_matrix, this.view_matrix);

        this.override_material = new EmptyMaterial(ShaderSource.Depth);

        const uniforms = new Map();
        uniforms.set("shadow_map_size", depth_texture_size);
        uniforms.set("shadow_distance", shadow_distance);
        uniforms.set("transition_distance", shadow_fade_distance);
        renderer.addShaderVariantUniforms(ShaderSource.PBR, uniforms);

        this.setupPass = () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.depth_frame_buffer);
            gl.viewport(0, 0, this.depth_texture_size, this.depth_texture_size);
            renderer.setPerFrameUniforms(this.view_matrix, this.proj_matrix);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.disable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.4, 4.0);
        };
        this.teardownPass = () => {
            gl.disable(gl.POLYGON_OFFSET_FILL);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            renderer.setPerFrameUniform(
                "shadow_map_space",
                mat4.mul(this.shadow_map_space_matrix, this.proj_matrix, this.view_matrix)
            );
            renderer.resetViewport();
        };

        const gl = renderer.gl;

        this.depth_frame_buffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depth_frame_buffer);

        //let a = gl.getExtension("EXT_color_buffer_float");

        this.depth_texture_float = new Texture2D(gl, undefined, {
            width: depth_texture_size,
            height: depth_texture_size,
            wrap_S: gl.CLAMP_TO_EDGE,
            wrap_T: gl.CLAMP_TO_EDGE,
            internal_format: gl.DEPTH_COMPONENT24,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_INT,
            mag_filter: gl.LINEAR,
            min_filter: gl.LINEAR,
            texture_compare_func: gl.LEQUAL,
            texture_compare_mode: gl.COMPARE_REF_TO_TEXTURE,
        });

        if (debug_render_rgba_texture)
            this.depth_texture_rgba = new Texture2D(gl, undefined, {
                width: depth_texture_size,
                height: depth_texture_size,
                wrap_S: gl.CLAMP_TO_EDGE,
                wrap_T: gl.CLAMP_TO_EDGE,
                internal_format: gl.RGBA,
                format: gl.RGBA,
                type: gl.UNSIGNED_BYTE,
                mag_filter: gl.NEAREST,
                min_filter: gl.NEAREST,
                texture_compare_func: gl.LEQUAL,
            });

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            this.depth_texture_float.texture_id,
            0
        );
        if (debug_render_rgba_texture && this.depth_texture_rgba)
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.depth_texture_rgba.texture_id,
                0
            );

        //Completed
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
            throw "depth texture frame buffer error";
    }
}

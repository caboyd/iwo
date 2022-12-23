import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Texture2D } from "@graphics/textures/Texture2D";
import { vec3 } from "gl-matrix";
import { Material, MaterialOptions } from "./Material";

export class BasicUnlitMaterial extends Material {
    public albedo_color: vec3;
    public albedo_image?: HTMLImageElement;
    public albedo_texture?: Texture2D;
    public material_options?: MaterialOptions;

    public constructor(color: vec3, options?: Partial<MaterialOptions>) {
        super();
        this.albedo_color = vec3.clone(color);
        this.material_options = options;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        const active_textures = [false, false];

        if (this.albedo_texture === undefined && this.albedo_image?.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: this.material_options?.flip_image_y ?? false,
            });
        }

        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
        }

        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo_color", this.albedo_color);
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.BasicUnlit;
    }
}

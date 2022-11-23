import { vec3 } from "gl-matrix";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Shader } from "@graphics/shader/Shader";
import { Texture2D } from "@graphics/Texture2D";
import { TextureCubeMap } from "@graphics/TextureCubeMap";
import { Material, MaterialOptions } from "./Material";

export class BasicMaterial extends Material {
    private equirectangular_albedo: boolean = false;
    public albedo_color: vec3;
    public albedo_image?: HTMLImageElement;
    public albedo_texture?: Texture2D;
    public albedo_cube_texture?: TextureCubeMap;
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
            if (this.equirectangular_albedo) shader.setUniform("u_material.equirectangular_texture", true);
        }

        if (this.albedo_cube_texture) {
            this.albedo_cube_texture.bind(gl, 1);
            active_textures[1] = true;
        }

        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo_color", this.albedo_color);
    }

    public setAlbedoTexture(tex: Texture2D, equirectangular: boolean = false): void {
        this.equirectangular_albedo = equirectangular;
        this.albedo_texture = tex;
    }

    public setAlbedoCubeTexture(tex: TextureCubeMap): void {
        this.albedo_cube_texture = tex;
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.Basic;
    }
}

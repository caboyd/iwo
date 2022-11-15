import { vec3 } from "gl-matrix";
import { Renderer } from "graphics/Renderer";
import { Shader } from "graphics/shader/Shader";
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Texture2D } from "graphics/Texture2D";
import { TextureCubeMap } from "graphics/TextureCubeMap";
import { Material, MaterialOptions } from "./Material";

export class PBRMaterial extends Material {
    public albedo: vec3;
    public metallic: number;
    public roughness: number;
    public ao: number = 1;
    public emissive_factor: vec3 = [1, 1, 1];
    public albedo_texture: Texture2D | undefined;
    public albedo_image: HTMLImageElement | undefined;
    public normal_texture: Texture2D | undefined;
    public normal_image: HTMLImageElement | undefined;
    public occlusion_texture: Texture2D | undefined;
    public occlusion_image: HTMLImageElement | undefined;
    public metal_roughness_texture: Texture2D | undefined;
    public metal_roughness_image: HTMLImageElement | undefined;
    public emissive_texture: Texture2D | undefined;
    public emissive_image: HTMLImageElement | undefined;
    public irradiance_texture: TextureCubeMap | undefined;
    public specular_env: TextureCubeMap | undefined;
    public shadow_texture: Texture2D | undefined;

    private material_options?: MaterialOptions;

    public constructor(
        color: vec3,
        metallic: number,
        roughness: number,
        ambient_occlusion?: number,
        emissive_factor?: vec3,
        material_options?: MaterialOptions
    ) {
        super();

        this.albedo = vec3.clone(color);
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion || this.ao;
        this.emissive_factor = emissive_factor || this.emissive_factor;
        this.material_options = material_options;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        const active_textures = [false, false, false, false, false, false, false, false];
        if (this.albedo_texture === undefined && this.albedo_image && this.albedo_image.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: this.material_options?.flip_image_y || false,
                internal_format: this.material_options?.disable_srgb ? gl.RGBA : gl.SRGB8_ALPHA8,
                format: gl.RGBA,
            });
        }
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
        }

        if (this.irradiance_texture) {
            this.irradiance_texture.bind(gl, 1);
            active_textures[1] = true;
        }

        if (this.specular_env) {
            this.specular_env.bind(gl, 2);
            active_textures[2] = true;
        }

        if (this.normal_texture === undefined && this.normal_image?.complete) {
            this.normal_texture = new Texture2D(gl, this.normal_image, {
                flip: this.material_options?.flip_image_y || false,
            });
        }
        if (this.normal_texture) {
            this.normal_texture.bind(gl, 3);
            active_textures[3] = true;
        }

        if (this.occlusion_texture === undefined && this.occlusion_image?.complete) {
            this.occlusion_texture = new Texture2D(gl, this.occlusion_image, {
                flip: this.material_options?.flip_image_y || false,
            });
        }
        if (this.occlusion_texture) {
            this.occlusion_texture.bind(gl, 4);
            active_textures[4] = true;
        }

        if (this.metal_roughness_texture === undefined && this.metal_roughness_image?.complete) {
            this.metal_roughness_texture = new Texture2D(gl, this.metal_roughness_image, {
                flip: this.material_options?.flip_image_y || false,
            });
        }
        if (this.metal_roughness_texture) {
            this.metal_roughness_texture.bind(gl, 5);
            active_textures[5] = true;
        }

        if (this.emissive_texture === undefined && this.emissive_image?.complete) {
            this.emissive_texture = new Texture2D(gl, this.emissive_image, {
                flip: this.material_options?.flip_image_y || false,
                internal_format: this.material_options?.disable_srgb ? gl.RGBA : gl.SRGB8_ALPHA8,
                format: gl.RGBA,
            });
        }
        if (this.emissive_texture) {
            this.emissive_texture.bind(gl, 6);
            active_textures[6] = true;
        }

        if (this.shadow_texture) {
            this.shadow_texture.bind(gl, 7);
            active_textures[7] = true;
        }

        if (Renderer.BRDF_LUT_TEXTURE) {
            gl.activeTexture(gl.TEXTURE8);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.BRDF_LUT_TEXTURE);
        }

        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
        shader.setUniform("u_material.emissive_factor", this.emissive_factor);
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.PBR;
    }
}

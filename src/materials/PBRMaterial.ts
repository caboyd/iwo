import { vec3 } from "gl-matrix";
import { Renderer } from "@graphics/renderer/Renderer";
import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Texture2D } from "@graphics/textures/Texture2D";
import { TextureCubeMap } from "@graphics/textures/TextureCubeMap";
import { Material, MaterialOptions } from "./Material";

export type PBRMaterialOptions = {
    albedo_color: vec3;
    metallic: number;
    roughness: number;
    ao: number;
    emissive_factor: vec3;
    light_factor: vec3;
    flat_shading: boolean;
    is_billboard: boolean;
    is_billboard_rot_y: boolean;
    albedo_texture?: Texture2D;
    albedo_image?: HTMLImageElement;
    normal_texture?: Texture2D;
    normal_image?: HTMLImageElement;
    occlusion_texture?: Texture2D;
    occlusion_image?: HTMLImageElement;
    metal_roughness_texture?: Texture2D;
    metal_roughness_image?: HTMLImageElement;
    emissive_texture?: Texture2D;
    emissive_image?: HTMLImageElement;
    irradiance_texture?: TextureCubeMap;
    specular_env_texture?: TextureCubeMap;
    shadow_texture?: Texture2D;
} & MaterialOptions;

const DefaultPBRMaterialOptions: PBRMaterialOptions = {
    albedo_color: [1, 1, 1],
    metallic: 0,
    roughness: 1,
    ao: 1,
    emissive_factor: [1, 1, 1],
    light_factor: [1, 1, 1],
    flat_shading: false,
    is_billboard: false,
    is_billboard_rot_y: false,
};

export class PBRMaterial extends Material {
    public albedo_color: vec3;
    public metallic: number;
    public roughness: number;
    public ao: number;
    public emissive_factor: vec3;
    public light_factor: vec3;
    public flat_shading: boolean;
    public is_billboard: boolean;
    public is_billboard_rot_y: boolean;
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
    public irradiance_texture_active: boolean;
    public specular_env_texture: TextureCubeMap | undefined;
    public specular_env_texture_active: boolean;
    public shadow_texture: Texture2D | undefined;

    private material_options?: MaterialOptions;

    public constructor(options?: Partial<PBRMaterialOptions>) {
        super();
        const opt = { ...DefaultPBRMaterialOptions, ...options };
        this.albedo_color = vec3.clone(opt.albedo_color);
        this.metallic = opt.metallic;
        this.roughness = opt.roughness;
        this.ao = opt.ao;
        this.emissive_factor = vec3.clone(opt.emissive_factor);
        this.light_factor = vec3.clone(opt.light_factor);
        this.flat_shading = opt.flat_shading;
        this.is_billboard = opt.is_billboard;
        this.is_billboard_rot_y = opt.is_billboard_rot_y;
        this.albedo_texture = opt.albedo_texture;
        this.albedo_image = opt.albedo_image;
        this.normal_texture = opt.normal_texture;
        this.normal_image = opt.normal_image;
        this.occlusion_texture = opt.occlusion_texture;
        this.occlusion_image = opt.occlusion_image;
        this.metal_roughness_texture = opt.metal_roughness_texture;
        this.metal_roughness_image = opt.metal_roughness_image;
        this.emissive_texture = opt.emissive_texture;
        this.emissive_image = opt.emissive_image;
        this.irradiance_texture = opt.irradiance_texture;
        this.irradiance_texture_active = true;
        this.specular_env_texture = opt.specular_env_texture;
        this.specular_env_texture_active = true;
        this.shadow_texture = opt.shadow_texture;
        this.material_options = opt;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        const active_textures = [false, false, false, false, false, false, false, false];
        if (this.albedo_texture === undefined && this.albedo_image?.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: this.material_options?.flip_image_y,
                internal_format: this.material_options?.disable_srgb ? gl.RGBA : gl.SRGB8_ALPHA8,
            });
        }
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
        }

        if (this.irradiance_texture) {
            this.irradiance_texture.bind(gl, 1);
            active_textures[1] = true && this.irradiance_texture_active;
        }

        if (this.specular_env_texture) {
            this.specular_env_texture.bind(gl, 2);
            active_textures[2] = true && this.specular_env_texture_active;
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
                flip: this.material_options?.flip_image_y,
                internal_format: this.material_options?.disable_srgb ? gl.RGBA : gl.SRGB8_ALPHA8,
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
        shader.setUniform("u_material.albedo_color", this.albedo_color);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
        shader.setUniform("u_material.emissive_factor", this.emissive_factor);
        shader.setUniform("u_material.light_factor", this.light_factor);
        // shader.setUniform("u_material.flat_shading", this.flat_shading);
    }

    public get shaderSource(): ShaderSource {
        const source = ShaderSource.PBR;
        source.material_define_flags = 0;
        if (this.flat_shading) source.material_define_flags |= ShaderSource.Define_Flag.FLATSHADING;
        if (this.is_billboard) source.material_define_flags |= ShaderSource.Define_Flag.BILLBOARD;
        if (this.is_billboard_rot_y) source.material_define_flags |= ShaderSource.Define_Flag.BILLBOARD_ROT_Y;
        return source;
    }
}

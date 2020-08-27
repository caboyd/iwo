import { Material } from "./Material";
import { Shader } from "graphics/shader/Shader";
import { Renderer } from "graphics/Renderer";
import { Texture2D } from "graphics/Texture2D";
import { vec3 } from "gl-matrix";
import { TextureCubeMap } from "graphics/TextureCubeMap";

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

    public constructor(
        color: vec3,
        metallic: number,
        roughness: number,
        ambient_occlusion?: number,
        emissive_factor?: vec3
    ) {
        super();

        this.albedo = vec3.clone(color);
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion || this.ao;
        this.emissive_factor = emissive_factor || this.emissive_factor;
    }

    public activate(gl: WebGL2RenderingContext): void {
        const shader = this.shader;
        const active_textures = [false, false, false, false, false, false];
        if (this.albedo_texture === undefined && this.albedo_image) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, { flip: false });
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

        if (this.normal_texture === undefined && this.normal_image) {
            this.normal_texture = new Texture2D(gl, this.normal_image, { flip: false });
        }
        if (this.normal_texture) {
            this.normal_texture.bind(gl, 3);
            active_textures[3] = true;
        }

        if (this.occlusion_texture === undefined && this.occlusion_image) {
            this.occlusion_texture = new Texture2D(gl, this.occlusion_image, { flip: false });
        }
        if (this.occlusion_texture) {
            this.occlusion_texture.bind(gl, 4);
            active_textures[4] = true;
        }

        if (this.metal_roughness_texture === undefined && this.metal_roughness_image) {
            this.metal_roughness_texture = new Texture2D(gl, this.metal_roughness_image, { flip: false });
        }
        if (this.metal_roughness_texture) {
            this.metal_roughness_texture.bind(gl, 5);
            active_textures[5] = true;
        }

        if (this.emissive_texture === undefined && this.emissive_image) {
            this.emissive_texture = new Texture2D(gl, this.emissive_image, { flip: false });
        }
        if (this.emissive_texture) {
            this.emissive_texture.bind(gl, 6);
            active_textures[6] = true;
        }

        if (Renderer.BRDF_LUT_TEXTURE) {
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.BRDF_LUT_TEXTURE);
        }

        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
        shader.setUniform("u_material.emissive_factor", this.emissive_factor);
    }

    public get shader(): Shader {
        return Renderer.GetShader("PBRShader")!;
    }

    public static get Shader(): Shader {
        return Renderer.GetShader("PBRShader")!;
    }

    private static generateBRDFLUT(gl: WebGL2RenderingContext): Texture2D {
        const tex = {} as Texture2D;
        tex.texture_id = gl.createTexture()!;

        return tex;
    }
}

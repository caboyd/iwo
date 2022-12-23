import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Texture2D } from "@graphics/textures/Texture2D";
import { vec3 } from "gl-matrix";
import { Material, MaterialOptions } from "./Material";

export type ToonMaterialOptions = {
    albedo_color: vec3;
    outline_color: vec3;
    specular_power: number;
    specular_intensity: number;
    diffuse_levels: number;
    specular_levels: number;
    light_factor: vec3;
    flat_shading: boolean;
    is_billboard: boolean;
    is_billboard_rot_y: boolean;
    albedo_image?: HTMLImageElement;
    albedo_texture?: Texture2D;
} & MaterialOptions;

export class ToonMaterial extends Material {
    public material_options?: MaterialOptions;
    public albedo_color: vec3 = [1, 1, 1];
    public outline_color: vec3 = [0, 0, 0];
    public specular_power: number = 128;
    public specular_intensity: number = 2;
    public diffuse_levels: number = 4;
    public specular_levels: number = 1;
    public light_factor: vec3 = [1, 1, 1];
    public flat_shading: boolean = false;
    public is_billboard: boolean = false;
    public is_billboard_rot_y: boolean = false;
    public albedo_image?: HTMLImageElement;
    public albedo_texture?: Texture2D;

    public constructor(options?: Partial<ToonMaterialOptions>) {
        super();
        if (options?.albedo_color) vec3.copy(this.albedo_color, options.albedo_color);
        this.specular_power = options?.specular_power ?? this.specular_power;
        this.specular_intensity = options?.specular_intensity ?? this.specular_intensity;
        this.diffuse_levels = options?.diffuse_levels ?? this.diffuse_levels;
        this.specular_levels = options?.specular_levels ?? this.specular_levels;
        if (options?.light_factor) vec3.copy(this.light_factor, options.light_factor);
        this.flat_shading = options?.flat_shading ?? this.flat_shading;
        this.is_billboard = options?.is_billboard ?? this.is_billboard;
        this.is_billboard_rot_y = options?.is_billboard_rot_y ?? this.is_billboard_rot_y;
        this.albedo_image = options?.albedo_image;
        this.albedo_texture = options?.albedo_texture;
        this.material_options = options;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        const is_texture_active = [false, false];

        if (this.albedo_texture === undefined && this.albedo_image?.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: this.material_options?.flip_image_y ?? false,
            });
        }

        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            is_texture_active[0] = true;
        }

        shader.setUniform("u_material.is_texture_active[0]", is_texture_active);
        shader.setUniform("u_material.albedo_color", this.albedo_color);
        shader.setUniform("u_material.outline_color", this.outline_color);
        shader.setUniform("u_material.specular_power", this.specular_power);
        shader.setUniform("u_material.specular_intensity", this.specular_intensity);
        shader.setUniform("u_material.diffuse_levels", this.diffuse_levels);
        shader.setUniform("u_material.specular_levels", this.specular_levels);
        shader.setUniform("u_material.light_factor", this.light_factor);
    }

    public get shaderSource(): ShaderSource {
        const source = ShaderSource.Toon;
        source.material_define_flags = 0;
        if (this.flat_shading) source.material_define_flags |= ShaderSource.Define_Flags.FLATSHADING;
        if (this.is_billboard) source.material_define_flags |= ShaderSource.Define_Flags.BILLBOARD;
        if (this.is_billboard_rot_y) source.material_define_flags |= ShaderSource.Define_Flags.BILLBOARD_ROT_Y;
        return source;
    }
}

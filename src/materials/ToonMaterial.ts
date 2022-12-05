import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Texture2D } from "@graphics/textures/Texture2D";
import { vec3 } from "gl-matrix";
import { Material, MaterialOptions } from "./Material";

type ToonMaterialOptions = {
    albedo_color: vec3;
    outline_color: vec3;
    specular_power: number;
    specular_intensity: number;
    diffuse_levels: number;
    specular_levels: number;
    flat_shading: boolean;
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
    public flat_shading: boolean = false;
    public albedo_image?: HTMLImageElement;
    public albedo_texture?: Texture2D;

    public constructor(options?: Partial<ToonMaterialOptions>) {
        super();
        if (options?.albedo_color) vec3.copy(this.albedo_color, options.albedo_color);
        this.specular_power = options?.specular_power ?? this.specular_power;
        this.specular_intensity = options?.specular_intensity ?? this.specular_intensity;
        this.diffuse_levels = options?.diffuse_levels ?? this.diffuse_levels;
        this.specular_levels = options?.specular_levels ?? this.specular_levels;
        this.flat_shading = options?.flat_shading ?? this.flat_shading;
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
    }

    public get shaderSource(): ShaderSource {
        const source = ShaderSource.Toon;
        source.material_defines = new Set<ShaderSource.Define>();
        if (this.flat_shading) source.material_defines.add(ShaderSource.Define.FLATSHADING);
        return source;
    }
}

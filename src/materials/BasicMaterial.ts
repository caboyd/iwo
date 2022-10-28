import { Material } from "./Material";
import { Shader } from "../graphics/shader/Shader";
import { Renderer } from "../graphics/Renderer";
import { Texture2D } from "../graphics/Texture2D";
import { vec3 } from "gl-matrix";
import { TextureCubeMap } from "../graphics/TextureCubeMap";

export class BasicMaterial extends Material {
    private equirectangular_albedo: boolean = false;
    public albedo: vec3;
    public albedo_image?: HTMLImageElement;
    public albedo_texture?: Texture2D;
    public albedo_cube_texture?: TextureCubeMap;

    public constructor(color: vec3) {
        super();
        this.albedo = vec3.clone(color);
    }

    public activate(gl: WebGL2RenderingContext): void {
        const shader = this.shader;
        const active_textures = [false, false];

        if (this.albedo_texture === undefined && this.albedo_image?.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: false,
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
        shader.setUniform("u_material.albedo", this.albedo);
    }

    public setAlbedoTexture(tex: Texture2D, equirectangular: boolean = false): void {
        this.equirectangular_albedo = equirectangular;
        this.albedo_texture = tex;
    }

    public setAlbedoCubeTexture(tex: TextureCubeMap): void {
        this.albedo_cube_texture = tex;
    }

    public get shader(): Shader {
        return Renderer.GetShader("BasicShader")!;
    }

    public static get Shader(): Shader {
        return Renderer.GetShader("BasicShader")!;
    }
}

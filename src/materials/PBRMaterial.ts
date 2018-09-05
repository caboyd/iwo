import { Material } from "./Material";
import { Shader } from "../graphics/Shader";
import { Renderer } from "../graphics/Renderer";
import { Texture2D } from "../graphics/Texture2D";
import { vec3, vec4 } from "gl-matrix";

export class PBRMaterial extends Material {
    albedo: vec3;
    metallic: number;
    roughness: number;
    ao: number;
    albedo_texture: Texture2D | undefined;

    constructor(color: vec3, metallic: number, roughness: number, ambient_occlusion: number = 1.0) {
        super();

        this.albedo = color;
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion;
    }

    public activate(gl: WebGL2RenderingContext): void {
        let shader = this.shader;
        shader.use();
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            shader.setUniform("u_material.active_textures[0]", true);
        } else {
            shader.setUniform("u_material.active_textures[0]", false);
        }

        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
    }

    public get shader(): Shader {
        return Renderer.PBRShader;
    }
}

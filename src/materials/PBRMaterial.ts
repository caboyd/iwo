import { Material } from "./Material";
import { Shader } from "../graphics/Shader";
import { Renderer } from "../graphics/Renderer";
import { Texture2D } from "../graphics/Texture2D";
import { vec3 } from "gl-matrix";

export class PBRMaterial extends Material {
    albedo: vec3;
    metallic: number;
    roughness: number;
    ao: number;
    albedo_texture: Texture2D | undefined;
    env_texture:Texture2D| undefined;

    constructor(color: vec3 | number[], metallic: number, roughness: number, ambient_occlusion: number = 1.0) {
        super();

        this.albedo = vec3.clone(color);
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion;
    }

    public activate(gl: WebGL2RenderingContext): void {
        let shader = this.shader;
        let active_textures = [false,false];
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
        } 

        if (this.env_texture) {
            this.env_texture.bind(gl, 1);
            active_textures[1] = true;
        } 
        
        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
    }

    public get shader(): Shader {
        return Renderer.PBRShader;
    }
}

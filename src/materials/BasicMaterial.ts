import { Material } from "./Material";
import { Shader } from "../graphics/Shader";
import { Renderer } from "../graphics/Renderer";
import { Texture2D } from "../graphics/Texture2D";
import { vec3 } from "gl-matrix";
import {Texture} from "./Texture";

export class BasicMaterial extends Material {
    albedo: vec3;
    albedo_texture: Texture | undefined;

    constructor(color:  vec3 | number[]) {
        super();

        this.albedo = vec3.clone(color);
    }

    public activate(gl: WebGL2RenderingContext): void {
        let shader = this.shader;
        this.bindAlbedo(gl,shader);
        shader.setUniform("u_material.albedo", this.albedo);
    }

    private bindAlbedo(gl:WebGL2RenderingContext, shader:Shader):void{
        shader.setUniform("u_material.equirectangular_textures[0]", false);
        shader.setUniform("u_material.active_textures[0]", false);
        
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl);
            shader.setUniform("u_material.active_textures[0]", true);
            if (this.albedo_texture.equirectangular)
                shader.setUniform("u_material.equirectangular_textures[0]", true);
        }
    }
    
    public setAlbedoTexture(tex:Texture2D):void{
        this.albedo_texture = new Texture(tex,0);
    }
    
    public get shader(): Shader {
        return Renderer.BasicShader;
    }
}

import {Material} from "./Material";
import {Shader} from "../graphics/Shader";
import {Renderer} from "../graphics/Renderer";
import {Texture2D} from "../graphics/Texture2D";
import {vec3, vec4} from "gl-matrix";

export class PBRMaterial extends  Material{
 
   
    albedo:vec4;
    metallic:number;
    roughness:number;
    ao:number;
    
    albedo_texture:Texture2D | undefined;


    constructor( color: vec4, metallic:number, roughness:number){
        super();
        
        this.albedo = color;
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = 1;
    }


    public activate(gl:WebGL2RenderingContext):void{
        let shader = this.shader;
        if(this.albedo_texture){
            this.albedo_texture.bind(gl,0);
            shader.setBoolByName("u_active_textures[0]", true);
        }else{
            gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
            shader.setBoolByName("u_material.active_textures[0]", false);
        }
        
        shader.setVec4ByName("u_material.albedo", this.albedo);
        shader.setFloatByName("u_material.roughness", this.roughness);
        shader.setFloatByName("u_material.metallic", this.metallic);
        shader.setFloatByName("u_material.ao", this.ao);
        
    }

    public get shader():Shader{
        return Renderer.PBRShader;
    }
}
//Base Material Class

import {Texture2D} from "../graphics/Texture2D";
import {Renderer} from "../graphics/Renderer";
import {tsTsxRegex} from "ts-loader/dist/types/constants";
import {vec3, vec4} from "gl-matrix";
import {Shader} from "../graphics/Shader";

export class Material {
    
    color:vec3;
    albedo:Texture2D | undefined;


    constructor(){
        this.color = vec3.create();
    }
    
    public activate(gl:WebGL2RenderingContext):void{
        if(this.albedo){
            this.albedo.bind(gl,0);
            Renderer.PBRShader.setBoolByName("u_active_textures[0]", true);
        }else{
            //gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
            Renderer.PBRShader.setBoolByName("u_active_textures[0]", false);
            Renderer.PBRShader.setVec3ByName("u_color", this.color);
        }
         
    }
    
    public get shader():Shader{
        return Renderer.PBRShader;
    }
}


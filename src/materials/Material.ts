//Base Material Class

import {Texture2D} from "../graphics/Texture2D";
import {Renderer} from "../graphics/Renderer";
import {tsTsxRegex} from "ts-loader/dist/types/constants";

export class Material {
    
    albedo:Texture2D | undefined;


    constructor(){
    }
    
    public activate(gl:WebGL2RenderingContext):void{
        if(this.albedo){
            this.albedo.bind(gl,0);
            Renderer.PBRShader.setBoolByName("active_textures[0]", true);
        }else{
            //gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
            Renderer.PBRShader.setBoolByName("active_textures[0]", false);
        }
         
    }
}


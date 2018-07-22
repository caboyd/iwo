import {Material} from "./Material";
import {Shader} from "../graphics/Shader";
import {Renderer} from "../graphics/Renderer";

export class GridMaterial extends Material{
    
    
    constructor(){
     super();   
    }
    
    activate(gl:WebGL2RenderingContext):void{
    }

    public get shader():Shader{
        return Renderer.GridShader;
    }
}

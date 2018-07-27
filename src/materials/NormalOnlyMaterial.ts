import {Material} from "./Material";
import {Renderer} from "../graphics/Renderer";
import {Shader} from "../graphics/Shader";

export class NormalOnlyMaterial extends  Material{
    constructor(){
        super();
    }

    public activate(gl:WebGL2RenderingContext):void{
    }

    public get shader():Shader{
        return Renderer.NormalOnlyShader;
    }
    
}
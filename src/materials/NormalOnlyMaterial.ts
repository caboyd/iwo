import {Material} from "./Material";
import {Renderer} from "../graphics/Renderer";
import {Shader} from "../graphics/Shader";

export class NormalOnlyMaterial extends  Material{
    constructor(){
        //TODO: Allows normal in world or view space
        super();
    }

    public activate(gl:WebGL2RenderingContext):void{
    }

    public get shader():Shader{
        return Renderer.NormalOnlyShader;
    }
    
}
//Base Material Class
import {Shader} from "../graphics/Shader";

export abstract class Material {
    
    protected constructor(){

    }
    
    public abstract activate(gl:WebGL2RenderingContext):void;         
    public abstract get shader():Shader;
}


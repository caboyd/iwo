import {Material} from "./Material";
import {Shader} from "../graphics/Shader";
import {Renderer} from "../graphics/Renderer";

export class GridMaterial extends Material{
    
    distance:number;
    frequency:number;
    
    constructor(view_distance:number, frequency:number = 1){
     super();   
     this.distance = view_distance;
     this.frequency = frequency;
    }
    
    activate(gl:WebGL2RenderingContext):void{
        let shader = this.shader;
        shader.setUniform("distance", this.distance);
        shader.setUniform("frequency", this.frequency);
    }

    public get shader():Shader{
        return Renderer.GridShader;
    }
}

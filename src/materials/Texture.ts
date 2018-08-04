import {Texture2D} from "../graphics/Texture2D";

export class Texture {
    
    texture:Texture2D;
    unit:number;

    constructor(texture:Texture2D, unit:number){
        this.texture = texture;
        this.unit = unit;
    }
    
    bind(gl:WebGL2RenderingContext):void{
        this.texture.bind(gl,this.unit);
    }
}

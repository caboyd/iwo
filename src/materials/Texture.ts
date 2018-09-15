import {Texture2D} from "../graphics/Texture2D";

export class Texture {
    
    texture:Texture2D;
    unit:number;
    equirectangular:boolean;

    constructor(texture:Texture2D, unit:number = 0){
        this.texture = texture;
        this.unit = unit;
        this.equirectangular = false;
    }
    
    bind(gl:WebGL2RenderingContext):void{
        this.texture.bind(gl,this.unit);
    }
}

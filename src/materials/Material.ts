//Base Material Class

import {Texture2D} from "../graphics/Texture2D";
import {Shader} from "../renderers/Shader";

export class Material {
    
    albedo:Texture2D | undefined;
    shader:Shader;

    constructor(shader:Shader){
        this.shader = shader;
    }
}


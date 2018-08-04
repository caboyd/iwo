import {Shader} from "./Shader";

export class PBRShader extends Shader{


    constructor(gl: WebGL2RenderingContext) {
        super(gl, require("src/shaders/standard.vert"),require("src/shaders/standard.frag"));
        this.use();
        
        this.setUniform("u_material.albedo_sampler", 0);
        
    }
}
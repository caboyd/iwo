import {Shader} from "./Shader";
import {Renderer} from "../Renderer";
import {ShaderSource} from "./ShaderSources";

export class PBRShader extends Shader{
    constructor(gl: WebGL2RenderingContext,
                vertexSourceCode:string = ShaderSource.PBR.vert,
                fragmentSourceCode:string = ShaderSource.PBR.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.irradiance_sampler", 1);
    }

    public use(): void {
        let gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
    }
}
import { Shader } from "./Shader";
import { Renderer } from "../Renderer";
import { ShaderSource } from "./ShaderSources";

export class PBRShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.PBR.vert,
        fragmentSourceCode: string = ShaderSource.PBR.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.irradiance_sampler", 1);
        this.setUniform("u_material.env_sampler", 2);
        this.setUniform("u_material.brdf_LUT_sampler", 3);
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
    }
}

import { Shader } from "./Shader";
import { Renderer } from "../renderer/Renderer";
import { ShaderSource } from "./ShaderSources";

export class CubemapToIrradianceShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.CubemapToIrradiance.vert,
        fragmentSourceCode: string = ShaderSource.CubemapToIrradiance.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
    }
}

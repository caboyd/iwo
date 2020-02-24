import { Shader } from "./Shader";
import { Renderer } from "../Renderer";
import { ShaderSource } from "./ShaderSources";

export class EquiToCubemapShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.EquiToCubemap.vert,
        fragmentSourceCode: string = ShaderSource.EquiToCubemap.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
    }
}

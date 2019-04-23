import {Shader} from "./Shader";
import {Renderer} from "../Renderer";
import {ShaderSource} from "./ShaderSources";

export class CubemapToIrradianceShader extends Shader {
    constructor(gl: WebGL2RenderingContext,
                vertexSourceCode: string = ShaderSource.CubeToIrradiance.vert,
                fragmentSourceCode: string = ShaderSource.CubeToIrradiance.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }

    public use(): void {
        let gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
    }
}
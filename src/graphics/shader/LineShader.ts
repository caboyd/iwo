import { Shader } from "./Shader";
import { ShaderSource } from "./ShaderSources";

export class LineShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.Line.vert,
        fragmentSourceCode: string = ShaderSource.Line.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
    }
}

import { Shader } from "./Shader";
import { Renderer } from "../renderer/Renderer";
import { ShaderSource } from "./ShaderSources";

export class BasicUnlitShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.BasicUnlit.vert,
        fragmentSourceCode: string = ShaderSource.BasicUnlit.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);

    }
}

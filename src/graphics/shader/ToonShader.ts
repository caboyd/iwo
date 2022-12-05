import { Shader } from "./Shader";
import { ShaderSource } from "./ShaderSources";

export class ToonShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.BasicUnlit.vert,
        fragmentSourceCode: string = ShaderSource.BasicUnlit.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
 
        this.setUniform("u_material.albedo_texture", 0);

        //this.setUniform("u_material.shadow_map_sampler", 2);

    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
    }
}

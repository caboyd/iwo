import { vec4 } from "gl-matrix";
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Shader } from "../graphics/shader/Shader";
import { Material } from "./Material";

export class LineMaterial extends Material {
    public color: vec4;

    private cull_face: boolean = false;

    public constructor(color: vec4) {
        super();
        this.color = vec4.clone(color);
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        shader.setUniform("color", this.color);
        this.cull_face = gl.getParameter(gl.CULL_FACE);
        gl.disable(gl.CULL_FACE);
    }

    public cleanupGLState(gl: WebGL2RenderingContext): void {
        if (this.cull_face) gl.enable(gl.CULL_FACE);
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.Line;
    }
}

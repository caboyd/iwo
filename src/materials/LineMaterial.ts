import { vec4 } from "gl-matrix";
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Shader } from "../graphics/shader/Shader";
import { Material } from "./Material";

export class LineMaterial extends Material {
    public color: vec4;
    public width: number;
    public resolution: [number, number];

    private cull_face: boolean = false;

    public constructor(resolution: [number, number], color: vec4, width: number) {
        super();
        this.color = vec4.clone(color);
        this.width = width;
        this.resolution = resolution;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        shader.setUniform("color", this.color);
        shader.setUniform("width", this.width);
        shader.setUniform("resolution", this.resolution);
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

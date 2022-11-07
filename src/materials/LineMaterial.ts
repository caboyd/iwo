import { Material } from "./Material";
import { Shader } from "../graphics/shader/Shader";
import { Renderer } from "../graphics/Renderer";
import { vec4 } from "gl-matrix";

export class LineMaterial extends Material {
    public color: vec4;

    private cull_face: boolean = false;

    public constructor(color: vec4) {
        super();
        this.color = vec4.clone(color);
    }

    public activate(gl: WebGL2RenderingContext): void {
        const shader = this.shader;
        shader.setUniform("color", this.color);
        this.cull_face = gl.getParameter(gl.CULL_FACE);
        gl.disable(gl.CULL_FACE);
    }

    public cleanupGLState(gl: WebGL2RenderingContext): void {
        if (this.cull_face) gl.enable(gl.CULL_FACE);
    }

    public get shader(): Shader {
        return Renderer.GetShader("LineShader")!;
    }

    public static get Shader(): Shader {
        return Renderer.GetShader("LineShader")!;
    }
}

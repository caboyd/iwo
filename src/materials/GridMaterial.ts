import { Shader } from "graphics/shader/Shader";
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Material } from "./Material";

export class GridMaterial extends Material {
    public distance: number;
    //Units between grey lines
    public frequency: number;
    //Unit between colored highlight lines
    public highlight_frequency: number;

    public constructor(view_distance: number, frequency: number = 1, highlight_frequency: number = 10) {
        super();
        this.distance = view_distance;
        this.frequency = frequency;
        this.highlight_frequency = highlight_frequency;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        shader.setUniform("distance", this.distance);
        shader.setUniform("frequency", this.frequency);
        shader.setUniform("highlight_frequency", this.highlight_frequency);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    public cleanupGLState(gl: WebGL2RenderingContext): void {
        gl.disable(gl.BLEND);
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.Grid;
    }
}

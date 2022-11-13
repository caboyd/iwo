import { vec4 } from "gl-matrix";
import { Shader } from "graphics/shader/Shader";
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Material } from "./Material";

export type GridMaterialOptions = {
    view_distance: number;
    frequency: number;
    highlight_frequency: number;
    base_color?: vec4;
    grid_color: vec4;
};

const DefaultGridMaterialOptions: GridMaterialOptions = {
    view_distance: 50,
    frequency: 1,
    highlight_frequency: 10,
    base_color: undefined,
    grid_color: [0.5, 0.5, 0.5, 1.0],
};

export class GridMaterial extends Material {
    public opt: GridMaterialOptions;

    public constructor(options?: Partial<GridMaterialOptions>) {
        super();
        this.opt = { ...DefaultGridMaterialOptions, ...options };
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        shader.setUniform("distance", this.opt.view_distance);
        shader.setUniform("frequency", this.opt.frequency);
        shader.setUniform("highlight_frequency", this.opt.highlight_frequency);
        if (this.opt.base_color) shader.setUniform("base_color", this.opt.base_color);
        shader.setUniform("grid_color", this.opt.grid_color);
        shader.setUniform("use_base_color", this.opt.base_color !== undefined);

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

import { Material } from "./Material";
import { Shader } from "graphics/shader/Shader";
import { Renderer } from "graphics/Renderer";

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

    public activate(gl: WebGL2RenderingContext): void {
        let shader = this.shader;
        shader.setUniform("distance", this.distance);
        shader.setUniform("frequency", this.frequency);
        shader.setUniform("highlight_frequency", this.highlight_frequency);
    }

    public get shader(): Shader {
        return Renderer.GetShader("GridShader")!;
    }
    public static get Shader(): Shader {
        return Renderer.GetShader("GridShader")!;
    }
}

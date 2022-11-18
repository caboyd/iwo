import { vec4 } from "gl-matrix";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Shader } from "@graphics/shader/Shader";
import { Material } from "./Material";

export class LineMaterial extends Material {
    public color: vec4;
    public width: number;
    public resolution: [number, number];
    public world_space: boolean;
    private cull_face: boolean = false;

    public constructor(resolution: [number, number], color: vec4, width: number, world_space: boolean) {
        super();
        this.color = vec4.clone(color);
        this.width = width;
        this.resolution = resolution;
        this.world_space = world_space;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        shader.setUniform("color", this.color);
        shader.setUniform("width", this.width);
        shader.setUniform("resolution", this.resolution);
        shader.setUniform("world_space", this.world_space);
    }

    public get shaderSource(): ShaderSource {
        return ShaderSource.Line;
    }
}

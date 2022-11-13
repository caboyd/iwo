import { ShaderSource } from "graphics/shader/ShaderSources";
import { Shader } from "../graphics/shader/Shader";
import { Material } from "./Material";

export class EmptyMaterial extends Material {
    public shader_source;

    public constructor(shader_source: ShaderSource) {
        super();
        this.shader_source = shader_source;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {}

    public get shaderSource(): ShaderSource {
        return this.shader_source;
    }
}

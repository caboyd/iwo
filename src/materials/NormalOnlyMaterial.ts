import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Material } from "./Material";

export class NormalOnlyMaterial extends Material {
    public constructor() {
        //TODO: Allows normal in world or view space
        super();
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {}

    public get shaderSource(): ShaderSource {
        return ShaderSource.NormalOnly;
    }
}

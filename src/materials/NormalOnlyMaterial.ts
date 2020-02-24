import { Material } from "./Material";
import { Renderer } from "graphics/Renderer";
import { Shader } from "graphics/shader/Shader";

export class NormalOnlyMaterial extends Material {
    public constructor() {
        //TODO: Allows normal in world or view space
        super();
    }

    public activate(gl: WebGL2RenderingContext): void {}

    public get shader(): Shader {
        return Renderer.GetShader("NormalOnlyShader")!;
    }

    public static get Shader(): Shader {
        return Renderer.GetShader("NormalOnlyShader")!;
    }
}

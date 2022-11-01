//Base Material Class
import { Shader } from "../graphics/shader/Shader";
import { Texture2D } from "graphics/Texture2D";

export type MaterialOptions = {
    flip_image_y?: boolean
    disable_srgb?: boolean
}

export abstract class Material {
    protected constructor() {}

    public abstract activate(gl: WebGL2RenderingContext): void;
    public abstract get shader(): Shader;
    public static get Shader(): Shader {
        return {} as Shader;
    }
}

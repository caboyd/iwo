//Base Material Class
import { ShaderSource } from "graphics/shader/ShaderSources";
import { Shader } from "../graphics/shader/Shader";

export type MaterialOptions = {
    flip_image_y?: boolean;
    disable_srgb?: boolean;
};

export abstract class Material {
    protected constructor() {}

    public abstract activate(gl: WebGL2RenderingContext, shader:Shader): void;
    public cleanupGLState?(gl: WebGL2RenderingContext): void;
    public abstract get shaderSource(): ShaderSource;

}

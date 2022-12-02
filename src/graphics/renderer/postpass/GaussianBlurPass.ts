import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Renderer } from "../Renderer";
import { PostProcessPass } from "./PostProcessPass";

export class GaussianBlur implements PostProcessPass {
    readonly setupPass: () => void;
    readonly teardownPass: () => void;
    onBeforePass?: (() => void) | undefined;
    onAfterPass?: (() => void) | undefined;
    shader: Shader;

    blur_factor: number = 7;

    constructor(renderer: Renderer) {
        this.shader = renderer.getorCreateShader(ShaderSource.GuassianBlur);
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("u_blur_factor", 7);

        this.setupPass = () => {
            renderer.setAndActivateShader(this.shader);
            this.shader.setUniform("u_resolution", [renderer.viewport.width, renderer.viewport.height]);
            this.shader.setUniform("u_blur_factor", this.blur_factor);
        };

        this.teardownPass = () => {};
    }
}

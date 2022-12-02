import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Renderer } from "../Renderer";
import { PostProcessPass } from "./PostProcessPass";

export const Tonemappings = ["Reinhard", "Reinhard2", "Lottes", "ACES", "Exposure", "Unreal"] as const;
export type Tonemapping = typeof Tonemappings[number];

export class TonemappingPass implements PostProcessPass {
    readonly setupPass: () => void;
    readonly teardownPass: () => void;
    onBeforePass?: (() => void) | undefined;
    onAfterPass?: (() => void) | undefined;
    shader: Shader;

    constructor(renderer: Renderer, type: Tonemapping = Tonemappings[0], gamma: number = 2.2) {
        this.shader = renderer.getorCreateShader(ShaderSource.HDR);
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("hdr_type", Tonemappings.indexOf(type));
        this.shader.setUniform("gamma", gamma);
        this.shader.setUniform("exposure", 1.0);

        this.setupPass = () => {}
        this.teardownPass = () => {}
    }

    public setTonemapping(renderer: Renderer, type: Tonemapping) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("tonemapping", Tonemappings.indexOf(type));
    }

    public setGamma(renderer: Renderer, value: number) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("gamma", value);
    }
    public setExposure(renderer: Renderer, value: number) {
        renderer.setAndActivateShader(this.shader);
        this.shader.setUniform("exposure", value);
    }
}

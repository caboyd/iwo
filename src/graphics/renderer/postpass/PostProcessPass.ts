import { Shader } from "@graphics/shader/Shader";

export interface PostProcessPass {
    readonly setupPass: () => void;
    readonly teardownPass: () => void;
    onBeforePass?: () => void;
    onAfterPass?: () => void;
    shader: Shader;
}

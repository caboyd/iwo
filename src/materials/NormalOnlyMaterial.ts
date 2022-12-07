import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Material } from "./Material";

export class NormalOnlyMaterial extends Material {
    public flat_shading: boolean = false;
    public is_billboard: boolean = false;

    public constructor(flat_shading?: boolean) {
        //TODO: Allows normal in world or view space
        super();
        this.flat_shading = flat_shading ?? this.flat_shading;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        //shader.setUniform("u_flat_shading", this.flat_shading);
    }

    public get shaderSource(): ShaderSource {
        const source = ShaderSource.NormalOnly;
        source.material_defines = new Set<ShaderSource.Define>();
        if (this.flat_shading) source.material_defines.add(ShaderSource.Define.FLATSHADING);
        if (this.is_billboard) source.material_defines.add(ShaderSource.Define.BILLBOARD);
        return source;
    }
}

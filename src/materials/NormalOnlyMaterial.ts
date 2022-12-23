import { Shader } from "@graphics/shader/Shader";
import { ShaderSource } from "@graphics/shader/ShaderSources";
import { Material } from "./Material";

export type NormalOnlyMaterialOptions = {
    flat_shading: boolean;
    is_billboard: boolean;
    is_billboard_rot_y: boolean;
};

export class NormalOnlyMaterial extends Material {
    public flat_shading: boolean = false;
    public is_billboard: boolean = false;
    public is_billboard_rot_y: boolean = false;

    public constructor(options?: Partial<NormalOnlyMaterialOptions>) {
        //TODO: Allows normal in world or view space
        super();
        this.flat_shading = options?.flat_shading ?? this.flat_shading;
        this.is_billboard = options?.is_billboard ?? this.is_billboard;
        this.is_billboard_rot_y = options?.is_billboard_rot_y ?? this.is_billboard_rot_y;
    }

    public activate(gl: WebGL2RenderingContext, shader: Shader): void {
        //shader.setUniform("u_flat_shading", this.flat_shading);
    }

    public get shaderSource(): ShaderSource {
        const source = ShaderSource.NormalOnly;
        source.material_defines = new Set<ShaderSource.Define>();
        if (this.flat_shading) source.material_defines.add(ShaderSource.Define.FLATSHADING);
        if (this.is_billboard) source.material_defines.add(ShaderSource.Define.BILLBOARD);
        if (this.is_billboard_rot_y) source.material_defines.add(ShaderSource.Define.BILLBOARD_ROT_Y);
        return source;
    }
}

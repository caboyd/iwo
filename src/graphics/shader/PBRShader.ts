import { Shader } from "./Shader";
import { Renderer } from "../renderer/Renderer";
import { ShaderSource } from "./ShaderSources";

export class PBRShader extends Shader {
    public constructor(
        gl: WebGL2RenderingContext,
        vertexSourceCode: string = ShaderSource.PBR.vert,
        fragmentSourceCode: string = ShaderSource.PBR.frag
    ) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("gamma", 2.2);
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.irradiance_sampler", 1);
        this.setUniform("u_material.env_sampler", 2);
        this.setUniform("u_material.normal_sampler", 3);
        this.setUniform("u_material.occlusion_sampler", 4);
        this.setUniform("u_material.metal_roughness_sampler", 5);
        this.setUniform("u_material.emissive_sampler", 6);
        this.setUniform("u_material.shadow_map_sampler", 7);

        this.setUniform("u_material.brdf_LUT_sampler", 8);
    }

    public use(): void {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        //gl.activeTexture(gl.TEXTURE7);
        //cant bind this to shadow map spot
        //gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
    }
}

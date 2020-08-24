import { Renderer } from "./Renderer";
import { mat4 } from "gl-matrix";
import { Texture2D } from "./Texture2D";
import { HDRBuffer, instanceOfHDRBuffer } from "loader/HDRImageLoader";
import { BoxGeometry } from "geometry/BoxGeometry";
import { Mesh } from "meshes/Mesh";
import { ShaderSource } from "./shader/ShaderSources";
import { CubeCamera } from "cameras/CubeCamera";
import { TextureHelper } from "./TextureHelper";
import { AttributeType, Geometry } from "geometry/Geometry";
import TypedArray = NodeJS.TypedArray;
import { BufferedGeometry } from "geometry/BufferedGeometry";

export class TextureCubeMap {
    public texture_id: WebGLTexture;

    public constructor(
        gl: WebGL2RenderingContext,
        source: ArrayBufferView | TexImageSource | undefined = undefined,
        width: number = 0,
        height: number = 0,
        wrap_S: number = gl.REPEAT,
        wrap_T: number = gl.REPEAT,
        wrap_R: number = gl.REPEAT,
        mag_filter: number = gl.LINEAR,
        min_filter: number = gl.LINEAR_MIPMAP_LINEAR,
        internal_format: number = gl.RGBA,
        format: number = gl.RGBA,
        type: number = gl.UNSIGNED_BYTE,
        flip: boolean = true
    ) {
        this.texture_id = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);

        if (source && source instanceof HTMLImageElement) {
            if (source.complete && source.src)
                //prettier-ignore
                TextureHelper.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter,
                    min_filter, internal_format, format, type, flip);
            else {
                source.addEventListener(
                    "load",
                    () => {
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
                        // eslint-disable-next-line prettier/prettier
                        TextureHelper.texParameterImage(
                            gl,
                            gl.TEXTURE_CUBE_MAP,
                            source,
                            wrap_S,
                            wrap_T,
                            wrap_R,
                            // eslint-disable-next-line prettier/prettier
                            mag_filter,
                            min_filter,
                            internal_format,
                            format,
                            type,
                            flip
                        );
                    },
                    { once: true }
                );
            }
        } else if (source && TextureHelper.isArrayBufferView(source)) {
            //prettier-ignore
            TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, source as ArrayBufferView, width, height, wrap_S,
                wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
        } else if (source) {
            //source is TexImageSource
            //prettier-ignore
            TextureHelper.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source as TexImageSource, wrap_S, wrap_T, wrap_R,
                mag_filter, min_filter, internal_format, format, type, flip);
        } else if (width !== 0 && height !== 0) {
            // This code path exists for rendering to empty textures
            //prettier-ignore
            TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, width, height, wrap_S, wrap_T, wrap_R,
                mag_filter, min_filter, internal_format, format, type, flip);
        } else {
            //No image or buffer sets texture to pink black checkerboard
            //prettier-ignore
            TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, TextureHelper.PINK_BLACK_CHECKERBOARD, 8, 8,
                wrap_S, wrap_T, wrap_R, gl.NEAREST, gl.NEAREST, internal_format, format, type, flip);
        }
    }

    public bind(gl: WebGL2RenderingContext, location: number): void {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        gl.deleteTexture(this.texture_id);
    }

    public static environmentFromEquirectangularHDRBuffer(
        renderer: Renderer,
        buffer: HDRBuffer,
        resolution: number = 512
    ): TextureCubeMap {
        const tex = new TextureCubeMap(renderer.gl);
        tex.setEquirectangularHDRBuffer(renderer, buffer, resolution);
        return tex;
    }

    public static irradianceFromEquirectangularHDRBuffer(
        renderer: Renderer,
        buffer: HDRBuffer,
        env_res: number = 512,
        irradiance_res: number = 32
    ): TextureCubeMap {
        const tex = new TextureCubeMap(renderer.gl);
        tex.setEquirectangularHDRBuffer(renderer, buffer, env_res);
        return tex;
    }

    public static specularFromCubemap(
        dest_cubemap: TextureCubeMap | undefined,
        renderer: Renderer,
        env_cubemap: TextureCubeMap,
        resolution: number = 128
    ): TextureCubeMap {
        const gl = renderer.gl;
        const ext = gl.getExtension("EXT_color_buffer_float");

        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);

        const specular_cubemap = dest_cubemap || ({ texture_id: gl.createTexture() } as TextureCubeMap);

        const box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh(gl, box_geom);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, specular_cubemap.texture_id);
        //prettier-ignore
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F,
            gl.RGBA, gl.HALF_FLOAT, false);

        const captureFBO: WebGLFramebuffer = gl.createFramebuffer()!;
        const captureRBO: WebGLRenderbuffer = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        const cam = new CubeCamera();

        // convert Environment cubemap to irradiance cubemap
        const shader = Renderer.GetShader(ShaderSource.CubemapSpecularPrefilter.name)!;
        shader.use();
        env_cubemap.bind(gl, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face) gl.disable(gl.CULL_FACE);

        const max_mip_levels = 5;
        for (let mip = 0; mip < max_mip_levels; mip++) {
            const mip_width = res * Math.pow(0.5, mip);
            const mip_height = res * Math.pow(0.5, mip);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mip_width, mip_height);
            gl.viewport(0, 0, mip_width, mip_height);

            const roughness = mip / (max_mip_levels - 1);
            shader.setUniform("roughness", roughness);

            for (let i = 0; i < 6; i++) {
                renderer.setPerFrameUniforms(cam.views[i], cam.projection);
                renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
                //prettier-ignore
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, specular_cubemap.texture_id, mip);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
            }
        }

        this.genBRDFLut(gl, captureFBO, captureRBO, renderer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face) gl.enable(gl.CULL_FACE);

        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);

        return specular_cubemap;
    }

    public static irradianceFromCubemap(
        dest_cubemap: TextureCubeMap | undefined,
        renderer: Renderer,
        env_cubemap: TextureCubeMap,
        resolution: number = 32
    ): TextureCubeMap {
        const gl = renderer.gl;

        const ext = gl.getExtension("EXT_color_buffer_float");

        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);

        const box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh(gl, box_geom);

        const irr_cubemap = dest_cubemap || ({ texture_id: gl.createTexture()! } as TextureCubeMap);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irr_cubemap.texture_id);
        //prettier-ignore
        TextureHelper.texParameterBuffer( gl, gl.TEXTURE_CUBE_MAP, null, res, res, gl.CLAMP_TO_EDGE,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, false
        );

        const captureFBO: WebGLFramebuffer = gl.createFramebuffer()!;
        const captureRBO: WebGLRenderbuffer = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        const cam = new CubeCamera();

        // convert Environment cubemap to irradiance cubemap
        const shader = Renderer.GetShader(ShaderSource.CubemapToIrradiance.name)!;
        shader.use();
        env_cubemap.bind(gl, 0);

        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face) gl.disable(gl.CULL_FACE);

        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(cam.views[i], cam.projection);
            renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
            //prettier-ignore
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                irr_cubemap.texture_id, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
        }

        this.genBRDFLut(gl, captureFBO, captureRBO, renderer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face) gl.enable(gl.CULL_FACE);

        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);

        return irr_cubemap;
    }

    public setEquirectangularHDRBuffer(
        renderer: Renderer,
        buffer: HDRBuffer,
        resolution: number = buffer.height
    ): void {
        this.setEquirectangular(renderer, buffer, resolution);
    }

    public setEquirectangularImage(renderer: Renderer, image: TexImageSource, resolution: number = image.height): void {
        this.setEquirectangular(renderer, image, resolution);
    }

    private setEquirectangular(renderer: Renderer, image_source: TexImageSource | HDRBuffer, resolution: number): void {
        const gl = renderer.gl;

        const ext = gl.getExtension("EXT_color_buffer_float");

        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);

        const box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh(gl, box_geom);

        let texture: Texture2D;

        if (instanceOfHDRBuffer(image_source)) {
            //prettier-ignore
            texture = new Texture2D(gl, image_source.data, image_source.width, image_source.height, gl.CLAMP_TO_EDGE,
                gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true
            );
        } else {
            //prettier-ignore
            texture = new Texture2D(gl, image_source,0,0, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE,
                gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true
            );
        }

        const captureFBO: WebGLFramebuffer = gl.createFramebuffer()!;
        const captureRBO: WebGLRenderbuffer = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        //prettier-ignore
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res, gl.CLAMP_TO_EDGE,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F, gl.RGBA,
            gl.HALF_FLOAT, false
        );

        const cam = new CubeCamera();

        // convert HDR equirectangular environment map to cubemap equivalent
        const shader = Renderer.GetShader("EquiToCubemapShader")!;
        shader.use();
        texture.bind(gl, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);

        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face) gl.disable(gl.CULL_FACE);

        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(cam.views[i], cam.projection);
            renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                this.texture_id,
                0
            );
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //let OpenGL generate mipmaps from first mip face (combatting visible dots artifact)
        this.bind(gl, 0);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        renderer.resetViewport();
        if (is_old_cull_face) gl.enable(gl.CULL_FACE);

        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        texture.destroy(gl);
        box_mesh.destroy(gl);
    }

    private static genBRDFLut(
        gl: WebGL2RenderingContext,
        captureFBO: WebGLFramebuffer,
        captureRBO: WebGLRenderbuffer,
        renderer: Renderer
    ): void {
        if (Renderer.BRDF_LUT_TEXTURE === undefined) {
            //Generate brdf LUT if it doesnt exist as its required for IBL
            const quad_geom = new Geometry();
            quad_geom.attributes = new Map<AttributeType, TypedArray>()
                .set(
                    AttributeType.Vertex,
                    new Float32Array([-1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0])
                )
                .set(AttributeType.Tex_Coord, new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]));
            quad_geom.groups = [];

            const quad_mesh = new Mesh(gl, quad_geom);
            quad_mesh.draw_mode = gl.TRIANGLE_STRIP;

            //prettier-ignore
            const lut_tex = new Texture2D(gl, undefined, 512, 512, gl.CLAMP_TO_EDGE, 
                gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RG16F, gl.RG, gl.HALF_FLOAT, false);
            gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lut_tex.texture_id, 0);
            gl.viewport(0, 0, 512, 512);
            const shader = Renderer.GetShader(ShaderSource.BRDF.name)!;
            shader.use();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(quad_mesh.draw_mode, quad_mesh.count, 0, quad_mesh.index_buffer, quad_mesh.vertex_buffer);
            Renderer.BRDF_LUT_TEXTURE = lut_tex.texture_id;
            quad_mesh.destroy(gl);
        }
    }
}

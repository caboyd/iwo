import {Renderer} from "./Renderer";
import {mat4} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {HDRBuffer, instanceOfHDRBuffer} from "loader/HDRImageLoader";
import {BoxGeometry} from "geometry/BoxGeometry";
import {Mesh} from "meshes/Mesh";
import {ShaderSource} from "./shader/ShaderSources";
import {CubeCamera} from "cameras/CubeCamera";
import {TextureHelper} from "./TextureHelper";
import {AttributeType, Geometry} from "geometry/Geometry";

export class TextureCubeMap {
    public texture_id: WebGLTexture;

    constructor(
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
                TextureHelper.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter,
                    min_filter, internal_format, format, type, flip);
            else {
                source.addEventListener("load", () => {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
                    TextureHelper.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter,
                        min_filter, internal_format, format, type, flip);
                }, {once: true});
            }
        } else if (source && TextureHelper.isArrayBufferView(source)) {
            TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, source as ArrayBufferView, width, height, wrap_S,
                wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
        } else if (source) {
            //source is TexImageSource
            TextureHelper.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source as TexImageSource, wrap_S, wrap_T, wrap_R,
                mag_filter, min_filter, internal_format, format, type, flip);
        } else if (width !== 0 && height !== 0) {
            TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, source, width, height, wrap_S, wrap_T, wrap_R,
                mag_filter, min_filter, internal_format, format, type, flip);
        } else {
            //No image or buffer sets texture to pink black checkerboard
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

    static environmentFromEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer,
                                                   resolution: number = 512): TextureCubeMap {
        let a = new TextureCubeMap(renderer.gl);
        a.setEquirectangularHDRBuffer(renderer, buffer, resolution);
        return a;
    }

    static irradianceFromEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer, env_res: number = 512,
                                                  irradiance_res: number = 32): TextureCubeMap {
        let a = new TextureCubeMap(renderer.gl);
        a.setEquirectangularHDRBuffer(renderer, buffer, env_res);
        return a;
    }

    static specularFromCubemap(dest_cubemap: TextureCubeMap | undefined, renderer: Renderer,
                               env_cubemap: TextureCubeMap, resolution: number = 128): TextureCubeMap {
        let gl = renderer.gl;

        let ext = gl.getExtension("EXT_color_buffer_float");

        let max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        let res = Math.min(resolution, max_res);

        let specular_cubemap = dest_cubemap || {texture_id: gl.createTexture()} as TextureCubeMap;

        let box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        let box_mesh = new Mesh(gl, box_geom);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, specular_cubemap.texture_id);
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F,
            gl.RGBA, gl.HALF_FLOAT, false);


        let captureFBO: WebGLFramebuffer;
        let captureRBO: WebGLRenderbuffer;
        captureFBO = gl.createFramebuffer()!;
        captureRBO = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        let cam = new CubeCamera();

        // convert Environment cubemap to irradiance cubemap
        let shader = Renderer.GetShader(ShaderSource.CubemapSpecularPrefilter.name)!;
        shader.use();
        env_cubemap.bind(gl, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        let is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face) gl.disable(gl.CULL_FACE);

        let max_mip_levels = 5;
        for (let mip = 0; mip < max_mip_levels; mip++) {
            let mip_width = res * Math.pow(0.5, mip);
            let mip_height = res * Math.pow(0.5, mip);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mip_width, mip_height);
            gl.viewport(0, 0, mip_width, mip_height);

            let roughness = mip / (max_mip_levels - 1);
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

        this.genBRDFLut(gl, captureFBO, captureRBO, renderer, box_mesh);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face) gl.enable(gl.CULL_FACE);

        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);

        return specular_cubemap;
    }

    static irradianceFromCubemap(dest_cubemap: TextureCubeMap | undefined, renderer: Renderer,
                                 env_cubemap: TextureCubeMap, resolution: number = 32): TextureCubeMap {
        let gl = renderer.gl;

        let ext = gl.getExtension("EXT_color_buffer_float");

        let max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        let res = Math.min(resolution, max_res);

        let box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        let box_mesh = new Mesh(gl, box_geom);

        let irr_cubemap = dest_cubemap || {texture_id: gl.createTexture()!} as TextureCubeMap;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irr_cubemap.texture_id);
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGBA16F,
            gl.RGBA, gl.HALF_FLOAT, false);

        let captureFBO: WebGLFramebuffer;
        let captureRBO: WebGLRenderbuffer;
        captureFBO = gl.createFramebuffer()!;
        captureRBO = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        let cam = new CubeCamera();

        // convert Environment cubemap to irradiance cubemap
        let shader = Renderer.GetShader(ShaderSource.CubemapToIrradiance.name)!;
        shader.use();
        env_cubemap.bind(gl, 0);

        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        let is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
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


        this.genBRDFLut(gl, captureFBO, captureRBO, renderer, box_mesh);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face) gl.enable(gl.CULL_FACE);

        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);

        return irr_cubemap;
    }


    public setEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer,
                                       resolution: number = buffer.height): void {
        this.setEquirectangular(renderer, buffer, resolution);
    }

    public setEquirectangularImage(renderer: Renderer, image: TexImageSource,
                                   resolution: number = image.height): void {
        this.setEquirectangular(renderer, image, resolution);
    }

    private setEquirectangular(renderer: Renderer, image_source: TexImageSource | HDRBuffer,
                               resolution: number): void {
        let gl = renderer.gl;

        let ext = gl.getExtension("EXT_color_buffer_float");

        let max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        let res = Math.min(resolution, max_res);

        let box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        let box_mesh = new Mesh(gl, box_geom);

        let texture: Texture2D;

        if (instanceOfHDRBuffer(image_source)) {
            texture = new Texture2D(gl, image_source.data, image_source.width, image_source.height, gl.CLAMP_TO_EDGE,
                gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true);
        } else {
            texture = new Texture2D(gl, image_source, 0, 0, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE,
                gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true);
        }

        let captureFBO: WebGLFramebuffer;
        let captureRBO: WebGLRenderbuffer;
        captureFBO = gl.createFramebuffer()!;
        captureRBO = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res,
            gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F,
            gl.RGBA, gl.HALF_FLOAT, false);

        let cam = new CubeCamera();

        // convert HDR equirectangular environment map to cubemap equivalent
        let shader = Renderer.GetShader("EquiToCubemapShader")!;
        shader.use();
        texture.bind(gl, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);

        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        let is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
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


    private static genBRDFLut(gl: WebGL2RenderingContext, captureFBO: WebGLFramebuffer, captureRBO: WebGLRenderbuffer,
                              renderer: Renderer,
                              box_mesh: Mesh) {
        if (Renderer.BRDF_LUT_TEXTURE === undefined) {
            //Generate brdf LUT if it doesnt exist as its required for IBL
            let quad_geom = {
                attribute_flags: AttributeType.Vertex | AttributeType.Tex_Coords,
                isInterleaved: true,
                interleaved_attributes: new Float32Array([
                    // positions        // texture Coords
                    -1.0, 1.0, 0.0,     0.0, 1.0,
                    -1.0, -1.0, 0.0,    0.0, 0.0,
                    1.0, 1.0, 0.0,      1.0, 1.0,
                    1.0, -1.0, 0.0,     1.0, 0.0,
                ]),
                groups: [{count:4,offset:0,material_index:0}],
            } as Geometry;
            let quad_mesh = new Mesh(gl, quad_geom);
            quad_mesh.draw_mode = gl.TRIANGLE_STRIP;

            //prettier-ignore
            let lut_tex = new Texture2D(gl, undefined, 512, 512, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE,
                gl.LINEAR, gl.LINEAR, gl.RG16F, gl.RG, gl.HALF_FLOAT, true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lut_tex.texture_id, 0);
            gl.viewport(0, 0, 512, 512);
            let shader = Renderer.GetShader(ShaderSource.BRDF.name)!;
            shader.use();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(quad_mesh.draw_mode, quad_mesh.count, 0, quad_mesh.index_buffer, quad_mesh.vertex_buffer);
            Renderer.BRDF_LUT_TEXTURE = lut_tex.texture_id;
            quad_mesh.destroy(gl);
        }
    }


}

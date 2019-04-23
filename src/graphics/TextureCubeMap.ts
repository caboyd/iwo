import {Renderer} from "./Renderer";
import {glMatrix, mat4, vec3} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {HDRBuffer} from "../loader/HDRImageLoader";
import {BoxGeometry} from "../geometry/BoxGeometry";
import {Mesh} from "../meshes/Mesh";
import {ShaderSource} from "./shader/ShaderSources";

export class TextureCubeMap {
    public texture_id: WebGLTexture;
    gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext, id: WebGLTexture | undefined = undefined) {
        this.gl = gl;
        if (id) {
            this.texture_id = id;
            return;
        }

        let ext = gl.getExtension("OES_texture_float_linear");
        let ext1 = gl.getExtension("EXT_color_buffer_float");
        this.texture_id = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        for (let i = 0; i < 6; i++) {
            // note that we store each face with 16 bit floating point values
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        if (gl.getExtension("OES_texture_float_linear")) {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    }

    static fromWebglTexture(gl: WebGL2RenderingContext, id: WebGLTexture) {

    }

    public destroy(gl: WebGL2RenderingContext): void {
        gl.deleteTexture(this.texture_id);
    }

    static environmentFromEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer, resolution: number = 512): TextureCubeMap {
        let a = new TextureCubeMap(renderer.gl);
        a.setEquirectangularHDRBuffer(renderer, buffer, resolution);
        return a;
    }

    static irradianceFromEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer, env_res: number = 512, irradiance_res: number = 32): TextureCubeMap {
        let a = new TextureCubeMap(renderer.gl);
        a.setEquirectangularHDRBuffer(renderer, buffer, env_res);
        return a;
    }

    static irradianceFromCubemap(old_cubemap:TextureCubeMap|undefined, renderer: Renderer, env_cubemap: TextureCubeMap, resolution: number = 32): TextureCubeMap {
        let gl = renderer.gl;

        let max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        let res = Math.min(resolution, max_res);

        let irr_cubemap =  old_cubemap || new TextureCubeMap(renderer.gl);

        let box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        let box_mesh = new Mesh(gl, box_geom);


        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irr_cubemap.texture_id);
        for (let i = 0; i < 6; i++) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, res, res, 0, gl.RGBA, gl.FLOAT, null);
        }

        let captureFBO: WebGLFramebuffer;
        let captureRBO: WebGLRenderbuffer;
        captureFBO = gl.createFramebuffer()!;
        captureRBO = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);


        let captureProjection: mat4 = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1.0, 0.1, 10);
        let captureViews: mat4[] = new Array<mat4>(
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(-1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, -1, 0), vec3.fromValues(0, 0, -1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, 1), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, -1), vec3.fromValues(0, -1, 0)),
        );

        // convert Environment cubemap to irradiance cubemap
        let shader = Renderer.GetShader(ShaderSource.CubeToIrradiance.name)!;
        shader.use();
        env_cubemap.bind(gl, 0);

        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.disable(gl.CULL_FACE);

        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(captureViews[i], captureProjection);
            renderer.setPerModelUniforms(mat4.create(), captureViews[i], captureProjection);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, irr_cubemap.texture_id, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);

        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(renderer.viewport.x, renderer.viewport.y, renderer.viewport.width, renderer.viewport.height);
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);

        return irr_cubemap;
    }

    public setEquirectangularHDRBuffer(renderer: Renderer, buffer: HDRBuffer, resolution: number = 512): void {
        let gl = this.gl;

        let max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        let res = Math.min(resolution, max_res);

        let box_geom = new BoxGeometry(2.0, 2.0, 2.0, 1, 1, 1, false);
        let box_mesh = new Mesh(gl, box_geom);


        let texture: Texture2D = new Texture2D(gl);
        if (gl.getExtension("OES_texture_float_linear"))
            texture.setImageByBuffer(gl, buffer.data, buffer.width, buffer.height, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true);
        else
            texture.setImageByBuffer(gl, buffer.data, buffer.width, buffer.height, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST, gl.RGB32F, gl.RGB, gl.FLOAT, true);


        let captureFBO: WebGLFramebuffer;
        let captureRBO: WebGLRenderbuffer;
        captureFBO = gl.createFramebuffer()!;
        captureRBO = gl.createRenderbuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        for (let i = 0; i < 6; i++) {
            // note that we store each face with 16 bit floating point values
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, res, res, 0, gl.RGBA, gl.FLOAT, null);
        }

        let captureProjection: mat4 = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1.0, 0.1, 10);
        let captureViews: mat4[] = new Array<mat4>(
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(-1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, -1, 0), vec3.fromValues(0, 0, -1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, 1), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, -1), vec3.fromValues(0, -1, 0)),
        );

        // convert HDR equirectangular environment map to cubemap equivalent
        let shader = Renderer.GetShader("EquiToCubemapShader")!;
        shader.use();
        texture.bind(gl, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);


        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.disable(gl.CULL_FACE);

        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(captureViews[i], captureProjection);
            renderer.setPerModelUniforms(mat4.create(), captureViews[i], captureProjection);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.texture_id, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);

        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(renderer.viewport.x, renderer.viewport.y, renderer.viewport.width, renderer.viewport.height);
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        texture.destroy(gl);
        box_mesh.destroy(gl);

    }

    public bind(gl: WebGL2RenderingContext, location: number): void {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
    }
}

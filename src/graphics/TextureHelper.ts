/**
 * Created by Chris on May, 2019
 */

type TextureType = WebGL2RenderingContext["TEXTURE_2D"] |
    WebGL2RenderingContext["TEXTURE_CUBE_MAP"] |
    WebGL2RenderingContext["TEXTURE_3D"] |
    WebGL2RenderingContext["TEXTURE_2D_ARRAY"];

export namespace TextureHelper {


    export function texParameterBuffer(gl: WebGL2RenderingContext,
                                       texture_type: TextureType,
                                       buffer: ArrayBufferView | null | undefined,
                                       width: number,
                                       height: number,
                                       wrap_S: number,
                                       wrap_T: number,
                                       wrap_R: number | undefined,
                                       mag_filter: number,
                                       min_filter: number,
                                       internal_format: number,
                                       format: number,
                                       type: number,
                                       flip: boolean,) {

        texParamHelperStart(gl, min_filter, format, flip);

        if (texture_type == gl.TEXTURE_CUBE_MAP) {
            for (let i = 0; i < 6; i++) {
                // note that we store each face with 16 bit floating point values
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internal_format, width, height, 0, format, type,
                    buffer);
            }
        } else if (texture_type == gl.TEXTURE_2D) {
            gl.texImage2D(texture_type, 0, internal_format, width, height, 0, format, type, buffer);
        } else {
            throw new Error(`texture type ${texture_type} not supported.`);
        }

        texParamHelperEnd(gl, texture_type, wrap_S, wrap_T, wrap_R, mag_filter, min_filter);
    }

    export function texParameterImage(gl: WebGL2RenderingContext,
                                      texture_type: TextureType,
                                      image: TexImageSource,
                                      wrap_S: number,
                                      wrap_T: number,
                                      wrap_R: number | undefined,
                                      mag_filter: number,
                                      min_filter: number,
                                      internal_format: number,
                                      format: number,
                                      type: number,
                                      flip: boolean,) {

        texParamHelperStart(gl, min_filter, format, flip);
        if (texture_type == gl.TEXTURE_CUBE_MAP) {
            for (let i = 0; i < 6; i++) {
                // note that we store each face with 16 bit floating point values
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internal_format, format, type, image);
            }
        } else if (texture_type == gl.TEXTURE_2D) {
            gl.texImage2D(texture_type, 0, internal_format, format, type, image);
        } else {
            throw new Error(`texture type ${texture_type} not supported.`);
        }

        texParamHelperEnd(gl, texture_type, wrap_S, wrap_T, wrap_R, mag_filter, min_filter);

    }

    function texParamHelperStart(gl: WebGL2RenderingContext,
                                 min_filter: number,
                                 format: number,
                                 flip: boolean) {
        let ext = gl.getExtension("OES_texture_float_linear");
        //Assert float linear supported if using float textures with linear filtering
        //one of gl.LINEAR, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, or gl.LINEAR_MIPMAP_LINEAR
        if (!ext && (format == gl.FLOAT || format == gl.HALF_FLOAT) && min_filter != gl.NEAREST && min_filter != gl.NEAREST_MIPMAP_NEAREST)
            throw new Error("TextureCubeMap loadBuffer failed. OES_texture_float_linear not available.");

        if (flip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    }

    function texParamHelperEnd(gl: WebGL2RenderingContext,
                               texture_type: TextureType,
                               wrap_S: number,
                               wrap_T: number,
                               wrap_R: number | undefined,
                               mag_filter: number,
                               min_filter: number) {
        gl.texParameteri(texture_type, gl.TEXTURE_WRAP_S, wrap_S);
        gl.texParameteri(texture_type, gl.TEXTURE_WRAP_T, wrap_T);
        if (wrap_R) gl.texParameteri(texture_type, gl.TEXTURE_WRAP_R, wrap_R);
        gl.texParameteri(texture_type, gl.TEXTURE_MAG_FILTER, mag_filter);
        gl.texParameteri(texture_type, gl.TEXTURE_MIN_FILTER, min_filter);
        if (min_filter == gl.LINEAR_MIPMAP_LINEAR ||
            min_filter == gl.LINEAR_MIPMAP_NEAREST ||
            min_filter == gl.NEAREST_MIPMAP_LINEAR ||
            min_filter == gl.NEAREST_MIPMAP_NEAREST)
            gl.generateMipmap(texture_type);
    }

    export function isArrayBufferView(value: any): boolean {
        return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
    }

    let arr = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            if (i & 1)
                arr.push(
                    0, 0, 0, 255, // black
                    255, 0, 255, 255 //pink
                );
            else
                arr.push(
                    255, 0, 255, 255, //pink
                    0, 0, 0, 255 // black
                );
        }
    }
    export let PINK_BLACK_CHECKERBOARD = new Uint8Array(arr);
}
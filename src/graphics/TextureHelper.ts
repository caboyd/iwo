/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Created by Chris on May, 2019
 */
import { TextureOptions } from "graphics/Texture2D";
import { TextureCubeMapOptions } from "graphics/TextureCubeMap";

type TextureType =
    | WebGL2RenderingContext["TEXTURE_2D"]
    | WebGL2RenderingContext["TEXTURE_CUBE_MAP"]
    | WebGL2RenderingContext["TEXTURE_3D"]
    | WebGL2RenderingContext["TEXTURE_2D_ARRAY"];

export namespace TextureHelper {
    export function texParameterBuffer(
        gl: WebGL2RenderingContext,
        texture_type: TextureType,
        buffer: ArrayBufferView | null,
        options: TextureOptions
    ): void {
        const o = options;
        texParamHelperStart(gl, o.min_filter, o.format, o.flip);

        if (texture_type == gl.TEXTURE_CUBE_MAP) {
            for (let i = 0; i < 6; i++) {
                // note that we store each face with 16 bit floating point values
                //prettier-ignore
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, o.internal_format, o.width, o.height,
                    0, o.format, o.type, buffer);
            }
        } else if (texture_type == gl.TEXTURE_2D) {
            gl.texImage2D(texture_type, 0, o.internal_format, o.width, o.height, 0, o.format, o.type, buffer);
        } else {
            throw new Error(`texture type ${texture_type} not supported.`);
        }

        texParamHelperEnd(gl, texture_type, options);
    }

    export function texParameterImage(
        gl: WebGL2RenderingContext,
        texture_type: TextureType,
        image: TexImageSource,
        options: TextureOptions | TextureCubeMapOptions
    ): void {
        const o = options;
        texParamHelperStart(gl, o.min_filter, o.format, o.flip);
        if (texture_type == gl.TEXTURE_CUBE_MAP) {
            for (let i = 0; i < 6; i++) {
                // note that we store each face with 16 bit floating point values
                //prettier-ignore
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, o.internal_format, o.format, options.type,
                    image as ImageData);
            }
        } else if (texture_type == gl.TEXTURE_2D) {
            gl.texImage2D(texture_type, 0, o.internal_format, o.format, o.type, image as ImageData);
        } else {
            throw new Error(`texture type ${texture_type} not supported.`);
        }

        texParamHelperEnd(gl, texture_type, o);
    }

    function texParamHelperStart(gl: WebGL2RenderingContext, min_filter: number, format: number, flip: boolean): void {
        const ext = gl.getExtension("OES_texture_float_linear");
        //Assert float linear supported if using float textures with linear filtering
        //one of gl.LINEAR, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, or gl.LINEAR_MIPMAP_LINEAR
        if (
            !ext &&
            (format == gl.FLOAT || format == gl.HALF_FLOAT) &&
            min_filter != gl.NEAREST &&
            min_filter != gl.NEAREST_MIPMAP_NEAREST
        )
            throw new Error("OES_texture_float_linear not available.");

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    }

    function texParamHelperEnd(gl: WebGL2RenderingContext, texture_type: TextureType, options: TextureOptions): void {
        gl.texParameteri(texture_type, gl.TEXTURE_WRAP_S, options.wrap_S);
        gl.texParameteri(texture_type, gl.TEXTURE_WRAP_T, options.wrap_T);
        gl.texParameteri(texture_type, gl.TEXTURE_WRAP_R, options.wrap_R);
        gl.texParameteri(texture_type, gl.TEXTURE_MAG_FILTER, options.mag_filter);
        gl.texParameteri(texture_type, gl.TEXTURE_MIN_FILTER, options.min_filter);
        if (
            [
                gl.LINEAR_MIPMAP_LINEAR,
                gl.LINEAR_MIPMAP_NEAREST,
                gl.NEAREST_MIPMAP_LINEAR,
                gl.NEAREST_MIPMAP_NEAREST,
            ].includes(options.min_filter)
        ) {
            gl.generateMipmap(texture_type);
        }
        if (options.texture_compare_func)
            gl.texParameteri(texture_type, gl.TEXTURE_COMPARE_FUNC, options.texture_compare_func);
        if (options.texture_compare_mode)
            gl.texParameteri(texture_type, gl.TEXTURE_COMPARE_MODE, options.texture_compare_mode);
    }

    export function isArrayBufferView(value: any): value is ArrayBufferView {
        return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
    }

    const arr = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            if (i & 1)
                //prettier-ignore
                arr.push(
                    0, 0, 0, 255, // black
                    255, 0, 255, 255 //pink
                );
            else
                //prettier-ignore
                arr.push(
                    255, 0, 255, 255, //pink
                    0, 0, 0, 255 // black
                );
        }
    }
    export const PINK_BLACK_CHECKERBOARD = new Uint8Array(arr);
}

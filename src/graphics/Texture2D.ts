import { TextureHelper } from "./TextureHelper";

export interface Texture2DOptions {
    width: number;
    height: number;
    wrap_S: number;
    wrap_T: number;
    mag_filter: number;
    min_filter: number;
    internal_format: number;
    format: number;
    type: number;
    flip: boolean;
}

export class Texture2D {
    public texture_id: WebGLTexture;

    public constructor(
        gl: WebGL2RenderingContext,
        source: ArrayBufferView | TexImageSource | undefined = undefined,
        width: number = 0,
        height: number = 0,
        wrap_S: number = gl.REPEAT,
        wrap_T: number = gl.REPEAT,
        mag_filter: number = gl.LINEAR,
        min_filter: number = gl.LINEAR_MIPMAP_LINEAR,
        internal_format: number = gl.RGBA,
        format: number = gl.RGBA,
        type: number = gl.UNSIGNED_BYTE,
        flip: boolean = false
    ) {
        this.texture_id = gl.createTexture()!;

        if (source instanceof HTMLImageElement && source) {
            if (source.complete && source.src)
                this.setImage(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
            else {
                //prettier-ignore
                source.addEventListener("load", () => {
                    this.setImage(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
                }, {once: true});
            }
        } else if (source && TextureHelper.isArrayBufferView(source)) {
            //prettier-ignore
            this.setImageByBuffer(gl, source as ArrayBufferView, width, height, wrap_S, wrap_T, mag_filter, min_filter,
                internal_format, format, type, flip);
        } else if (source) {
            //prettier-ignore
            this.setImage(gl, source as TexImageSource, wrap_S, wrap_T, mag_filter, min_filter, internal_format,
                format, type, flip);
        } else if (width !== 0 && height !== 0) {
            //prettier-ignore
            //Making empty texture of some width and height because you want to render to it
            this.setImageByBuffer(gl, null, width, height, wrap_S, wrap_T, mag_filter, min_filter, internal_format,
                format, type, flip);
        } else {
            //No image or buffer sets texture to pink black checkerboard
            //This should probably happen at the material loading level and not during texture setting
            //prettier-ignore
            this.setImageByBuffer(gl, TextureHelper.PINK_BLACK_CHECKERBOARD, 8, 8, gl.REPEAT,
                gl.MIRRORED_REPEAT, gl.NEAREST, gl.NEAREST);
        }
    }

    public bind(gl: WebGL2RenderingContext, location: number): void {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
    }

    public setImage(
        gl: WebGL2RenderingContext,
        image: TexImageSource,
        wrap_S: number = gl.REPEAT,
        wrap_T: number = gl.REPEAT,
        mag_filter: number = gl.LINEAR,
        min_filter: number = gl.LINEAR_MIPMAP_LINEAR,
        internal_format: number = gl.RGBA,
        format: number = gl.RGBA,
        type: number = gl.UNSIGNED_BYTE,
        flip: boolean = true
    ): void {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper.texParameterImage(gl, gl.TEXTURE_2D, image, wrap_S, wrap_T, undefined, mag_filter, 
            min_filter, internal_format, format, type, flip);
    }

    public setImageByBuffer(
        gl: WebGL2RenderingContext,
        buffer: ArrayBufferView | null,
        width: number,
        height: number,
        wrap_S: number = gl.REPEAT,
        wrap_T: number = gl.REPEAT,
        mag_filter: number = gl.LINEAR,
        min_filter: number = gl.LINEAR_MIPMAP_LINEAR,
        internal_format: number = gl.RGBA,
        format: number = gl.RGBA,
        type: number = gl.UNSIGNED_BYTE,
        flip: boolean = true
    ): void {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_2D, buffer, width, height, wrap_S, wrap_T, undefined,
            mag_filter, min_filter, internal_format, format, type, flip);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        gl.deleteTexture(this.texture_id);
    }
}

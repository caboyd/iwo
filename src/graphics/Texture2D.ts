import { TextureHelper } from "./TextureHelper";
import { GL } from "graphics/WebglConstants";

export interface TextureOptions {
    width: number;
    height: number;
    wrap_S: number;
    wrap_T: number;
    wrap_R: number;
    mag_filter: number;
    min_filter: number;
    internal_format: number;
    format: number;
    type: number;
    flip: boolean;
}

export const DefaultTextureOptions = {
    width: 0,
    height: 0,
    wrap_S: GL.REPEAT,
    wrap_T: GL.REPEAT,
    wrap_R: GL.REPEAT,
    mag_filter: GL.LINEAR,
    min_filter: GL.LINEAR_MIPMAP_LINEAR,
    internal_format: GL.RGBA,
    format: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    flip: false,
};

export class Texture2D {
    public texture_id: WebGLTexture;

    public constructor(
        gl: WebGL2RenderingContext,
        source: ArrayBufferView | TexImageSource | undefined = undefined,
        options?: Partial<TextureOptions>
    ) {
        const o: TextureOptions = { ...DefaultTextureOptions, ...options };
        this.texture_id = gl.createTexture()!;

        if (source instanceof HTMLImageElement && source) {
            if (source.complete && source.src) this.setImage(gl, source, o);
            else {
                //prettier-ignore
                source.addEventListener("load", () => {
                    this.setImage(gl, source,o);
                }, {once: true});
            }
        } else if (source && TextureHelper.isArrayBufferView(source)) {
            //prettier-ignore
            this.setImageByBuffer(gl, source as ArrayBufferView, o);
        } else if (source) {
            //prettier-ignore
            this.setImage(gl, source as TexImageSource, o);
        } else if (o.width !== 0 && o.height !== 0) {
            //prettier-ignore
            //Making empty texture of some width and height because you want to render to it
            this.setImageByBuffer(gl, null, o);
        } else {
            //No image or buffer exists. so we set texture to pink black checkerboard
            //This should probably happen at the material loading level and not during texture setting
            const o2 = {
                ...DefaultTextureOptions,
                ...{
                    width: 8,
                    height: 8,
                    wrap_S: gl.REPEAT,
                    wrap_T: gl.MIRRORED_REPEAT,
                    mag_filter: gl.NEAREST,
                    min_filter: gl.NEAREST,
                },
            };
            this.setImageByBuffer(gl, TextureHelper.PINK_BLACK_CHECKERBOARD, o2);
        }
    }

    public bind(gl: WebGL2RenderingContext, location: number): void {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
    }

    public setImage(gl: WebGL2RenderingContext, image: TexImageSource, options?: Partial<TextureOptions>): void {
        const o: TextureOptions = { ...DefaultTextureOptions, ...options };
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper.texParameterImage(gl, gl.TEXTURE_2D, image, o);
    }

    public setImageByBuffer(
        gl: WebGL2RenderingContext,
        buffer: ArrayBufferView | null,
        options?: Partial<TextureOptions>
    ): void {
        const o: TextureOptions = { ...DefaultTextureOptions, ...options };
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper.texParameterBuffer(gl, gl.TEXTURE_2D, buffer, o);
    }

    public destroy(gl: WebGL2RenderingContext): void {
        gl.deleteTexture(this.texture_id);
    }
}

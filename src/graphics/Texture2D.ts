//TODO: Allow for multiple image data types
type TexImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap | ImageData;

export class Texture2D {
    public texture_id: WebGLTexture;

    constructor(
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
        flip: boolean = true,
    ) {
        this.texture_id = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        if (source instanceof HTMLImageElement && source) {
            if (source.complete && source.src)
                Texture2D.load(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
            else {
                //prettier-ignore
                source.addEventListener("load", () => {
                    Texture2D.load(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
                }, {once: true});
            }
        } else if (source && isArrayBufferView(source)) {
            Texture2D.loadBuffer(gl, source as ArrayBufferView, width, height, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        } else if (source) {
            Texture2D.load(gl, source as TexImageSource, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        } else {
            // Fill the texture with a 16x16 pink/black checkerboard to denote missing texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16,
                0, gl.RGBA, gl.UNSIGNED_BYTE, pink_black_checkerboard
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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
        Texture2D.load(gl, image, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
    }

    public setImageByBuffer(
        gl: WebGL2RenderingContext,
        buffer: ArrayBufferView,
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
        Texture2D.loadBuffer(gl, buffer, width, height, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
    }

    private static load(
        gl: WebGL2RenderingContext,
        image: TexImageSource,
        wrap_S: number,
        wrap_T: number,
        mag_filter: number,
        min_filter: number,
        internal_format: number,
        format: number,
        type: number,
        flip: boolean
    ): void {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip ? 1 : 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal_format, format, type, image);
        if (min_filter == gl.LINEAR_MIPMAP_LINEAR) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_S);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_T);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filter);
    }

    private static loadBuffer(
        gl: WebGL2RenderingContext,
        buffer: ArrayBufferView,
        width: number,
        height: number,
        wrap_S: number,
        wrap_T: number,
        mag_filter: number,
        min_filter: number,
        internal_format: number,
        format: number,
        type: number,
        flip: boolean,
    ) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip ? 1 : 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal_format, width, height, 0, format, type, buffer);
        if (min_filter == gl.LINEAR_MIPMAP_LINEAR) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_S);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_T);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filter);
    }
    
    public destroy(gl:WebGL2RenderingContext): void{
        gl.deleteTexture(this.texture_id);
    }
}

function isArrayBufferView(value: any): boolean {
    return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
}

let arr = [];
for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
        if (i & 1)
            arr.push(
                0,
                0,
                0,
                255, // black
                255,
                0,
                255,
                255 //pink
            );
        else {
            arr.push(
                255,
                0,
                255,
                255, //pink
                0,
                0,
                0,
                255 // black
            );
        }
    }
}
let pink_black_checkerboard = new Uint8Array(arr);

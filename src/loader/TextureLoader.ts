import { ImageLoader } from "./ImageLoader";
import { Texture2D } from "../graphics/Texture2D";

export class TextureLoader {
    public static load(
        gl: WebGL2RenderingContext,
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/")),
        wrap_S: number = gl.REPEAT,
        wrap_T: number = gl.REPEAT,
        mag_filter: number = gl.LINEAR,
        min_filter: number = gl.LINEAR_MIPMAP_LINEAR,
        internal_format: number = gl.RGBA,
        format: number = gl.RGBA,
        type: number = gl.UNSIGNED_BYTE,
        flip: boolean = true
    ): Texture2D {
        const tex = new Texture2D(gl, new Image());
        ImageLoader.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        });
        return tex;
    }
}

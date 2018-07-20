import { ImageLoader } from "./ImageLoader";
import { Texture2D } from "../graphics/Texture2D";

//TODO: allow alpha and flip to be specified
export class TextureLoader {
    static load(
        gl: WebGL2RenderingContext,
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Texture2D {
        let tex = new Texture2D(gl, new Image(), true);
        ImageLoader.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, true, false);
        });
        return tex;
    }
}

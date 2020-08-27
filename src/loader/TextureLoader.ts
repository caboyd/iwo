import { ImageLoader } from "./ImageLoader";
import { Texture2D, TextureOptions } from "../graphics/Texture2D";
import { FileLoader } from "loader/FileLoader";

export class TextureLoader {
    public static load(
        gl: WebGL2RenderingContext,
        file_name: string,
        base_url: string = FileLoader.Default_Base_URL,
        options?: Partial<TextureOptions>
    ): Texture2D {
        const tex = new Texture2D(gl, new Image());
        ImageLoader.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, options);
        });
        return tex;
    }
}

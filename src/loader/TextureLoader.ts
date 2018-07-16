import {FileLoader} from "./FileLoader";

export class TextureLoader extends FileLoader {

    static promise(file_name: string, base_url: string = ""): Promise<any> {
        let img = new Image();
        return super.promise(file_name, base_url)
            .then( (data) => {
                img.src = URL.createObjectURL(data);
                return img;
            })
    }
}
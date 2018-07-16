import {FileLoader} from "./FileLoader";

export class TextureLoader extends FileLoader {


    static load(file_name: string, base_url: string = ""): Promise<any> {
        let img = new Image();
        return super.load(file_name, base_url)
            .then( (data) => {
                img.src = URL.createObjectURL(data);
                
                
                return img;
            })
    }
}
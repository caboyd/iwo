import { FileLoader } from "./FileLoader";

export class ImageLoader extends FileLoader {
    static promise(file_name: string, base_url: string = ""): Promise<HTMLImageElement> {
        let img = new Image();
        return super.promise(file_name, base_url).then(data => {
            img.src = URL.createObjectURL(data);
            return img;
        });
    }

    static load(file_name: string, base_url: string = ""): HTMLImageElement {
        let img = new Image();
        if (!base_url.endsWith("/")) base_url += "/";
        img.src = base_url + file_name;
        // super.promise(file_name, base_url).then(data => {
        //     setTimeout(
        //         function(){img.src = URL.createObjectURL(data);
        //         console.log("promise done")},1000);
        // });
        return img;
    }
}

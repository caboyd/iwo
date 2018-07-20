import { FileLoader } from "./FileLoader";

export class ImageLoader extends FileLoader {
    static promise(
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>(resolve => {
            super.promise(file_name, base_url).then(data => {
                let img = new Image();
                img.src = URL.createObjectURL(data);
                img.onload = () => resolve(img);
            });
        });
    }

    static promiseAll(
        files: string[],
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HTMLImageElement[]> {
        let imgs = Array.from({ length: files.length }, u => new Image());
        let promises: Promise<HTMLImageElement>[] = [];

        return super.promiseAll(files, base_url).then((data: Blob[]) => {
            for (let i = 0; i < data.length; i++) {
                let img = imgs[i];
                let promise = new Promise<HTMLImageElement>(function(resolve) {
                    img.src = URL.createObjectURL(data[i]);
                    img.onload = () => resolve(img);
                });
                promises.push(promise);
            }
            return Promise.all(promises).then(images => {
                return images;
            });
        });
    }

    static load(file_name: string, base_url: string = ""): HTMLImageElement {
        let img = new Image();
        super.promise(file_name, base_url).then(data => {
            img.src = URL.createObjectURL(data);
        });
        // super.onAllComplete(1);
        return img;
    }
}

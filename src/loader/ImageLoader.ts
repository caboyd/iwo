import {FileLoader} from "./FileLoader";

export class ImageLoader extends FileLoader {
    static promise(
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.blob().then((data: Blob) => {
                    let img = new Image();
                    const clear = () => img.onload = img.onerror = null;
                    img.src = URL.createObjectURL(data);
                    img.onload = () => {clear(); resolve(img)};
                    img.onerror = e => {clear(); reject(e)};
                });
            });
        });
    }

    static promiseAll(
        files: string[],
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HTMLImageElement[]> {
        let imgs = Array.from({length: files.length}, u => new Image());
        let promises: Promise<HTMLImageElement>[] = [];

        return super.promiseAll(files, base_url).then((responses: Response[] | any) => {
            for (let i = 0; i < responses.length; i++) {
                let img = imgs[i];
                const clear = () => img.onload = img.onerror = null;
                let promise = new Promise<HTMLImageElement>((resolve, reject) => {
                    responses[i].blob().then((data: Blob) => {
                        img.src = URL.createObjectURL(data);
                        img.onload = () => {clear(); resolve(img)};
                        img.onerror = e => {clear(); reject(e)};
                    });
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        });
    }

    static load(file_name: string, base_url: string = ""): HTMLImageElement {
        let img = new Image();
        super.promise(file_name, base_url).then(data => {
            img.src = URL.createObjectURL(data);
        });
        return img;
    }
}

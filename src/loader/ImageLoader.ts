import { FileLoader } from "./FileLoader";

export class ImageLoader extends FileLoader {
    public static async promise(
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.blob().then((data: Blob) => {
                    const img = new Image();
                    const clear = (): null => (img.onload = img.onerror = null);
                    img.src = URL.createObjectURL(data);
                    img.onload = (): void => {
                        clear();
                        resolve(img);
                    };
                    img.onerror = (e): void => {
                        clear();
                        reject(e);
                    };
                });
            });
        });
    }

    public static async promiseAll(
        files: string[],
        base_url: string = FileLoader.Default_Base_URL
    ): Promise<HTMLImageElement[]> {
        const imgs = Array.from({ length: files.length }, u => new Image());
        const promises: Promise<HTMLImageElement>[] = [];

        return super.promiseAll(files, base_url).then((responses: Response[] | any) => {
            for (let i = 0; i < responses.length; i++) {
                const img = imgs[i];
                const clear = (): null => (img.onload = img.onerror = null);
                const promise = new Promise<HTMLImageElement>((resolve, reject) => {
                    responses[i].blob().then((data: Blob) => {
                        img.src = URL.createObjectURL(data);
                        img.onload = (): void => {
                            clear();
                            resolve(img);
                        };
                        img.onerror = (e): void => {
                            clear();
                            reject(e);
                        };
                    });
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        });
    }

    public static load(file_name: string, base_url: string = ""): HTMLImageElement {
        const img = new Image();
        super.promise(file_name, base_url).then(data => {
            img.src = URL.createObjectURL(data);
        });
        return img;
    }
}

const ReadableStream = (window as any).ReadableStream;

export class FileLoader {
    protected static onProgress: (loaded_bytes: number, total_bytes:number, file_name:string) => void = () => {};

    protected static onFileComplete: (
        num_complete: number,
        total_to_complete: number,
        file_name: string
    ) => void = () => {};

    protected static onAllComplete: (total_complete: number) => void = () => {};

    static async promiseAll(files: string[], base_url: string = ""): Promise<any[]> {
        let total = files.length;
        let num_complete = 0;
        let promises: Promise<Blob>[] = [];
        for (let file of files) {
            let p = FileLoader.promise(file, base_url);
            promises.push(p);
            p.then(() => {
                num_complete++;
                FileLoader.onFileComplete(num_complete, total, file);
            });
        }

        let result = Promise.all(promises);
        result.then(() => {
            FileLoader.onAllComplete(total);
        });
        return result;
    }

    static promise(file_name: string, base_url: string = ""): Promise<any> {
        if (!base_url.endsWith("/")) base_url += "/";

        return fetch(base_url + file_name)
            .then(response => {
                if (!response.ok) {
                    throw Error(response.status + " " + response.statusText);
                }

                const contentLength = response.headers.get("content-length");
                if (!contentLength) {
                    throw Error("Content-Length response header unavailable");
                }

                const total = parseInt(contentLength, 10);
                if(response.body && ReadableStream)
                    return FileLoader.readAllChunks(<any>response.body, total, file_name);
                else return response;
            })
            .then(response => response.blob())
            .then((data: Blob) => {
                return data;
            });
    }

    static setOnProgress(f: (loaded_bytes: number, total_bytes:number, file_name:string)=> void): void {
        this.onProgress = f;
    }

    static setOnFileComplete(f: (num_complete: number, total_to_complete: number, file_name: string) => void): void {
        this.onFileComplete = f;
    }

    static setOnAllComplete(f: (total_complete: number) => void): void {
        this.onAllComplete = f;
    }

    private static readAllChunks(readableStream: ReadableStream, total_size: number, file_name:string): Response {
        let loaded = 0;
        const reader = readableStream.getReader();
        let stream = new ReadableStream({
            async start(controller: any): Promise<void> {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }
                    loaded += value.byteLength;
                    FileLoader.onProgress(loaded, total_size, file_name);
                    controller.enqueue(value);
                }
                controller.close();
                reader.releaseLock();
            }
        });
        return new Response(stream, {});
    }
}

import { FileLoader } from "./FileLoader";
import { Material } from "materials/Material";



export class ObjLoader extends FileLoader {
    public static async promise(file_name: string, base_url: string = this.Default_Base_URL): Promise<Material[]> {
        return new Promise<Material[]>(resolve => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.text().then((s: string) => {
                    const data = ObjLoader.fromMtlString(s);

                    resolve(data);
                });
            });
        });
    }

    private static fromMtlString(s: string, float32Array = Float32Array): Material[] {
        const lines = s.split(/\r?\n/);

        const m = new Array<Material>();

        return m;
    }
}

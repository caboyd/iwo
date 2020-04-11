import { FileLoader } from "./FileLoader";
import { AttributeType, Geometry } from "geometry/Geometry";

export class ObjLoader extends FileLoader {
    public static async promise(file_name: string, base_url: string = this.Default_Base_URL): Promise<Geometry> {
        return new Promise<Geometry>(resolve => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.text().then((s: string) => {
                    const geometry = ObjLoader.fromObjString(s);

                    resolve(geometry);
                });
            });
        });
    }

    private static fromObjString(s: string, float32Array = Float32Array): Geometry {
        const lines = s.split(/\r?\n/);

        const vertices = [];
        const tex_coords = [];

        const geom: Geometry = {
            indices: undefined,
            attribute_flags: 0,
            attributes: new Map<AttributeType, ArrayBufferView>(),
            groups: [],
            isInterleaved: true,
            interleaved_attributes: undefined,
        };

        return geom;
    }
}

import { FileLoader } from "./FileLoader";
import { AttributeType, Geometry, Group } from "geometry/Geometry";
import { MeshInstance } from "meshes/MeshInstance";
import { glTF, MeshPrimitive } from "loader/spec/glTF";
import { Attribute, BufferedGeometry } from "geometry/BufferedGeometry";

export class glTFLoader {
    public static async promise(
        gl: WebGL2RenderingContext,
        file_name: string,
        base_url: string = FileLoader.Default_Base_URL
    ): Promise<MeshInstance> {
        return new Promise<MeshInstance>(resolve => {
            FileLoader.promise(file_name, base_url).then((response: Response) => {
                response.json().then(async (o: glTF) => {
                    console.log(o);
                    if (!o.buffers) {
                        console.warn(`${file_name} has no buffers`);
                        throw `Unexpected: ${file_name} has no buffers`;
                    }

                    const buffers = (await FileLoader.promiseAll(
                        o.buffers.map(v => v.uri!),
                        base_url
                    )) as Response[];

                    const array_buffers = await Promise.all(buffers.map(v => v.arrayBuffer()));

                    console.log(array_buffers);
                    // o.buffers[0].

                    let images;
                    if (o.images)
                        images = FileLoader.promiseAll(
                            o.images.map(v => v.uri!),
                            base_url
                        );

                    const buffered_geoms = buildBufferedGeometry(o);

                    const groups = [];
                    for (const mesh of o.meshes!) {
                        for (const prim of mesh.primitives) {
                            //FIXME: this is not covering any case except one where we have indices and no submesh
                            const group = {
                                offset: 0,
                                count: o.accessors![prim.indices!].count,
                                material_index: prim.material,
                            } as Group;
                            groups.push(group);
                        }
                    }
                 //   const geom: BufferedGeometry = { attributes: [], buffers: [], groups: [] };

                   // console.log(geom);

                    // let mesh = new Mesh(gl,{
                    //     indices:
                    //     attribute_flags: number;
                    //     attributes: Map<AttributeType, ArrayBufferView>;
                    //     groups: Group[];
                    //
                    //     isInterleaved: boolean;
                    //     interleaved_attributes: Float32Array | undefined;
                    // });

                    return {} as MeshInstance;
                });
            });
        });
    }

    // private static fromString(s: string, float32Array = Float32Array): MeshInstance {
    //
    //
    //
    // }
}

function buildBufferedGeometry(o: glTF): BufferedGeometry[] {
    const attributes = buildAttributes(o.meshes![0].primitives[0]);
    return [] as BufferedGeometry[];
}

function buildAttributes(o: MeshPrimitive): Attribute[] {
    return [] as Attribute[];
}

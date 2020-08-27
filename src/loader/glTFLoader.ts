import { FileLoader } from "./FileLoader";
import { AttributeType } from "geometry/Geometry";
import { Accessor, glTF, MeshPrimitive } from "loader/spec/glTF";
import { Attribute, BufferedGeometry, DefaultAttribute } from "geometry/BufferedGeometry";
import { Material } from "materials/Material";
import { ImageLoader } from "loader/ImageLoader";
import { ComponentType } from "graphics/WebglConstants";
import { TypedArray } from "types/types";
import { PBRMaterial } from "materials/PBRMaterial";
import { vec3 } from "gl-matrix";
import { Texture2D } from "graphics/Texture2D";

export interface glTFData {
    buffered_geometries: BufferedGeometry[];
    materials: Material[];
}

interface BufferView {
    buffer: ArrayBuffer;
    target: 34962 | 34963 | number;
}

class Color {
    public readonly data: readonly [number, number, number, number];

    public constructor(r?: number | number[], g?: number, b?: number, a?: number) {
        if (Array.isArray(r)) {
            const [red, green, blue, alpha] = r;
            this.data = [red, green ?? red, blue ?? red, alpha ?? 1];
        } else {
            const red = r ?? 1.0;
            this.data = [red, g ?? red, b ?? red, a ?? 1];
        }
    }

    public get rgb(): vec3 {
        return this.data.slice(0, 3) as vec3;
    }

    public get rbga(): [number, number, number, number] {
        return [...this.data];
    }
}

export class glTFLoader {
    public static async promise(file_name: string, base_url: string = FileLoader.Default_Base_URL): Promise<glTFData> {
        return new Promise<glTFData>(resolve => {
            FileLoader.promise(file_name, base_url).then((response: Response) => {
                response.json().then(async (o: glTF) => {
                    //Validate toplevel
                    if (o.meshes === undefined) glTFLoaderError(o.meshes);
                    if (o.buffers === undefined) glTFLoaderError(o.buffers);
                    if (o.bufferViews === undefined) glTFLoaderError(o.bufferViews);
                    if (o.accessors === undefined) glTFLoaderError(o.accessors);

                    const buffers = (await FileLoader.promiseAll(
                        o.buffers.map(v => v.uri!),
                        base_url
                    )) as Response[];

                    const array_buffers = await Promise.all(buffers.map(v => v.arrayBuffer()));

                    // const typed_buffer_view = new Map<[number, ComponentType], TypedArray>();

                    // const geom_buffers: BufferView[] = [];
                    // for (const buffer_view of o.bufferViews) {
                    //     if (buffer_view.target === undefined)
                    //         throw new Error("Unexpected glTF bufferview with no target");
                    //     geom_buffers.push({
                    //         buffer: new DataView(
                    //             array_buffers[buffer_view.buffer],
                    //             buffer_view.byteOffset ?? 0,
                    //             buffer_view.byteLength
                    //         ),
                    //         target: buffer_view.target,
                    //     });
                    // }
                    //convert DataViews to proper buffers

                    //    const typed_buffers = array_buffers.map(b => new Uint8Array(b));
                    // console.log(array_buffers);
                    // console.log(geom_buffers);

                    let images: HTMLImageElement[] = [];
                    if (o.images)
                        images = await ImageLoader.promiseAll(
                            o.images.map(v => v.uri!),
                            base_url
                        );

                    const buffered_geometries = [];

                    for (const mesh of o.meshes) {
                        const x = new BufferedGeometry();
                        //x.buffers = geom_buffers;
                        if (mesh.primitives.length === 0) throw new Error("glTF missing mesh primitives");
                        if (mesh.primitives.length > 1)
                            throw new Error("Don't know how to handle more than one primitive per mesh");
                        // for (const prim of mesh.primitives) {
                        //     //FIXME: this is not covering any case except one where we have indices and no submesh
                        //     const group = {
                        //         offset: 0,
                        //         //use indices count
                        //         count:
                        //             prim.indices !== undefined
                        //                 ? o.accessors![prim.indices].count
                        //                 : o.accessors![prim.attributes["POSITION"]].count,
                        //         material_index: prim.material,
                        //     } as Group;
                        //     groups.push(group);
                        // }
                        const prim = mesh.primitives[0]!;
                        if (prim.indices !== undefined) {
                            const accessor = o.accessors[prim.indices];
                            const buffer_view = o.bufferViews[accessor.bufferView!];
                            const count = accessor.count;
                            const componentType = accessor.componentType;
                            const buffer_index = buffer_view.buffer;
                            const offset = buffer_view.byteOffset;
                            const bytes = count > 66536 ? 4 : 2;
                            const length = buffer_view.byteLength / bytes;
                            x.index_buffer = {
                                buffer: ArrayBufferToTypedArray(
                                    componentType,
                                    array_buffers[buffer_index],
                                    offset,
                                    length
                                ),
                                target: 34963,
                            };
                            //  x.index_buffer =
                            //        {
                            //            buffer: count > 66536
                            //            ? geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint32(0)
                            //            : await geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint16(0);
                            // target:geom_buffers[o.accessors[prim.indices].bufferView!].target
                            //        } as GeometryBuffer
                        }

                        let my_buffer_index = 0;
                        x.attributes = DefaultAttribute.SingleBufferApproach();
                        let attrib_index: number | undefined;
                        let a = x.attributes[AttributeType.Vertex];
                        if ((attrib_index = prim.attributes["POSITION"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                o,
                                AttributeType.Vertex,
                                o.accessors![attrib_index]!,
                                x,
                                array_buffers,
                                a,
                                my_buffer_index++
                            );
                        } else {
                            a.enabled = false;
                        }

                        a = x.attributes[AttributeType.Tex_Coord];
                        if ((attrib_index = prim.attributes["TEXCOORD_0"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                o,
                                AttributeType.Tex_Coord,
                                o.accessors![attrib_index]!,
                                x,
                                array_buffers,
                                a,
                                my_buffer_index++
                            );
                        } else {
                            a.enabled = false;
                        }

                        a = x.attributes[AttributeType.Normal];
                        if ((attrib_index = prim.attributes["NORMAL"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                o,
                                AttributeType.Normal,
                                o.accessors![attrib_index]!,
                                x,
                                array_buffers,
                                a,
                                my_buffer_index++
                            );
                        } else {
                            a.enabled = false;
                        }

                        a = x.attributes[AttributeType.Tangent];
                        if ((attrib_index = prim.attributes["TANGENT"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                o,
                                AttributeType.Tangent,
                                o.accessors![attrib_index]!,
                                x,
                                array_buffers,
                                a,
                                my_buffer_index++
                            );
                        } else {
                            a.enabled = false;
                        }

                        buffered_geometries.push(x);
                    }
                    const materials = [];
                    if (o.materials !== undefined)
                        for (const mat of o.materials) {
                            const m = new PBRMaterial(
                                new Color(mat.pbrMetallicRoughness?.baseColorFactor).rgb,
                                mat.pbrMetallicRoughness?.metallicFactor ?? 1,
                                mat.pbrMetallicRoughness?.roughnessFactor ?? 1
                            );
                            m.albedo_image = images[mat.pbrMetallicRoughness!.baseColorTexture!.index!];
                            m.normal_image = images[mat.normalTexture!.index];
                            m.occlusion_image = images[mat.occlusionTexture!.index];
                            m.metal_roughness_image = images[mat.pbrMetallicRoughness!.metallicRoughnessTexture!.index];
                            m.emissive_image = images[mat.emissiveTexture!.index];
                            materials.push(m);
                        }

                    resolve({ buffered_geometries: buffered_geometries, materials: materials } as glTFData);

                    function glTFLoaderError(prop: any): never {
                        throw new Error(`${file_name} missing ${prop in o}`);
                    }
                });
            });
        });
    }

    //TODO: CLEANUP
    private static buildAttributeAndTypedBuffer(
        o: glTF,
        type: AttributeType,
        accessor: Accessor,
        x: BufferedGeometry,
        array_buffers: ArrayBuffer[],
        a: Attribute,
        my_buffer_index: number
    ): void {
        const buffer_view = o.bufferViews![accessor.bufferView!];
        const componentType = accessor.componentType;
        const buffer_index = buffer_view.buffer;
        const offset = buffer_view.byteOffset;
        const length = buffer_view.byteLength / 4;
        x.buffers.push({
            buffer: ArrayBufferToTypedArray(componentType, array_buffers[buffer_index], offset, length),
            target: 34962,
        });

        a.type = type;
        a.enabled = true;
        a.buffer_index = my_buffer_index;
        a.component_type = accessor.componentType;
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

function ArrayBufferToTypedArray(
    component_type: ComponentType,
    view: ArrayBuffer,
    offset: number = 0,
    length?: number
): TypedArray {
    switch (component_type) {
        case 5120:
        case 5121:
            return new Uint8Array(view, offset, length);
        case 5122:
            return new Int16Array(view, offset, length);
        case 5123:
            return new Uint16Array(view, offset, length);
        case 5124:
            return new Int32Array(view, offset, length);
        case 5125:
            return new Uint32Array(view, offset, length);
        case 5126:
            return new Float32Array(view, offset, length);
        default:
            throw new Error(`Bad ComponentType ${component_type}`);
    }
}

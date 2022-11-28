import { FileLoader } from "./FileLoader";
//https://www.npmjs.com/package/gltf-typescript-generator
import { Attribute } from "@geometry/attribute/Attribute";
import { StandardAttribute } from "@geometry/attribute/StandardAttribute";
import { vec3 } from "gl-matrix";
import { ComponentType, GL } from "@graphics/WebglConstants";
import { ImageLoader } from "@loader/ImageLoader";
import { Accessor, glTF, MeshPrimitive } from "@loader/spec/glTF";
import { Material } from "@materials/Material";
import { PBRMaterial } from "@materials/PBRMaterial";
import { TypedArray } from "@customtypes/types";
import { Geometry } from "@geometry/Geometry";

export interface glTFData {
    geometries: Geometry[];
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
        return new Promise<glTFData>((resolve) => {
            FileLoader.promise(file_name, base_url).then((response: Response) => {
                response.json().then(async (gltf: glTF) => {
                    //Validate toplevel
                    if (gltf.meshes === undefined) glTFLoaderError(gltf.meshes);
                    if (gltf.buffers === undefined) glTFLoaderError(gltf.buffers);
                    if (gltf.bufferViews === undefined) glTFLoaderError(gltf.bufferViews);
                    if (gltf.accessors === undefined) glTFLoaderError(gltf.accessors);

                    const result: glTFData = { geometries: [], materials: [] };

                    const buffers = (await FileLoader.promiseAll(
                        gltf.buffers.map((v) => v.uri!),
                        base_url
                    )) as Response[];

                    const array_buffers = await Promise.all(buffers.map((v) => v.arrayBuffer()));

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
                    if (gltf.images) {
                        images = ImageLoader.loadAllBackground(
                            gltf.images.map((v) => v.uri!),
                            base_url
                        );
                    }

                    for (const mesh of gltf.meshes) {
                        const geom: Geometry = {
                            attributes: StandardAttribute.SingleBufferApproach(),
                            buffers: [],
                            count: 0,
                            draw_mode: GL.TRIANGLES,
                        };
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
                            const accessor = gltf.accessors[prim.indices];
                            const buffer_view = gltf.bufferViews[accessor.bufferView!];
                            const count = accessor.count;
                            const componentType = accessor.componentType as ComponentType;
                            const buffer_index = buffer_view.buffer;
                            const offset = buffer_view.byteOffset;
                            const bytes_per_element = count > 66536 ? 4 : 2;
                            const length = buffer_view.byteLength / bytes_per_element;
                            const buffer = ArrayBufferToTypedArray(
                                componentType,
                                array_buffers[buffer_index],
                                offset,
                                length
                            );
                            geom.index_buffer =
                                bytes_per_element === 2 ? (buffer as Uint16Array) : (buffer as Uint32Array);
                            geom.count = length;
                            //  x.index_buffer =
                            //        {
                            //            buffer: count > 66536
                            //            ? geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint32(0)
                            //            : await geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint16(0);
                            // target:geom_buffers[o.accessors[prim.indices].bufferView!].target
                            //        } as GeometryBuffer
                        }

                        let buf_index = 0;
                        let attrib_index: number | undefined;
                        let attr = geom.attributes[StandardAttribute.Position.name];
                        if ((attrib_index = prim.attributes["POSITION"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                gltf,
                                attr,
                                gltf.accessors![attrib_index]!,
                                geom,
                                array_buffers,
                                buf_index++
                            );
                        } else {
                            attr.enabled = false;
                        }

                        attr = geom.attributes[StandardAttribute.Tex_Coord.name];
                        if ((attrib_index = prim.attributes["TEXCOORD_0"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                gltf,
                                attr,
                                gltf.accessors![attrib_index]!,
                                geom,
                                array_buffers,
                                buf_index++
                            );
                        } else {
                            attr.enabled = false;
                        }

                        attr = geom.attributes[StandardAttribute.Normal.name];
                        if ((attrib_index = prim.attributes["NORMAL"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                gltf,
                                attr,
                                gltf.accessors![attrib_index]!,
                                geom,
                                array_buffers,
                                buf_index++
                            );
                        } else {
                            attr.enabled = false;
                        }

                        attr = geom.attributes[StandardAttribute.Tangent.name];
                        if ((attrib_index = prim.attributes["TANGENT"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(
                                gltf,
                                attr,
                                gltf.accessors![attrib_index]!,
                                geom,
                                array_buffers,
                                buf_index++
                            );
                        } else {
                            attr.enabled = false;
                        }

                        result.geometries.push(geom);
                    }
                    if (gltf.materials !== undefined)
                        for (const mat of gltf.materials) {
                            const m = new PBRMaterial({
                                albedo_color: new Color(mat.pbrMetallicRoughness?.baseColorFactor).rgb,
                                metallic: mat.pbrMetallicRoughness?.metallicFactor ?? 1,
                                roughness: mat.pbrMetallicRoughness?.roughnessFactor ?? 1,
                                albedo_image: images[mat.pbrMetallicRoughness!.baseColorTexture!.index!],
                                normal_image: images[mat.normalTexture!.index],
                                occlusion_image: images[mat.occlusionTexture!.index],
                                metal_roughness_image:
                                    images[mat.pbrMetallicRoughness!.metallicRoughnessTexture!.index],
                                emissive_image: images[mat.emissiveTexture!.index],
                            });
                            result.materials.push(m);
                        }

                    resolve(result);

                    function glTFLoaderError(prop: any): never {
                        throw new Error(`${file_name} missing ${prop in gltf}`);
                    }
                });
            });
        });
    }

    //TODO: CLEANUP
    private static buildAttributeAndTypedBuffer(
        o: glTF,
        attr: Attribute,
        accessor: Accessor,
        geom: Geometry,
        array_buffers: ArrayBuffer[],
        my_buffer_index: number
    ): void {
        const buffer_view = o.bufferViews![accessor.bufferView!];
        const componentType = accessor.componentType as ComponentType;
        const buffer_index = buffer_view.buffer;
        const offset = buffer_view.byteOffset;
        const length = buffer_view.byteLength / 4;
        geom.buffers.push(ArrayBufferToTypedArray(componentType, array_buffers[buffer_index], offset, length));

        attr.enabled = true;
        attr.buffer_index = my_buffer_index;
        attr.component_type = componentType;
    }
}

function ArrayBufferToTypedArray(
    component_type: ComponentType,
    view: ArrayBuffer,
    offset: number = 0,
    length?: number
): TypedArray {
    switch (component_type) {
        case GL.UNSIGNED_BYTE:
        case GL.BYTE:
            return new Uint8Array(view, offset, length);
        case GL.SHORT:
            return new Int16Array(view, offset, length);
        case GL.UNSIGNED_SHORT:
            return new Uint16Array(view, offset, length);
        case GL.INT:
            return new Int32Array(view, offset, length);
        case GL.UNSIGNED_INT:
            return new Uint32Array(view, offset, length);
        case GL.FLOAT:
            return new Float32Array(view, offset, length);
        default:
            throw new Error(`Bad ComponentType ${component_type}`);
    }
}

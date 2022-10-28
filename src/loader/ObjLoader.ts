import { FileLoader } from "./FileLoader";
import { AttributeType, Geometry } from "geometry/Geometry";
import { Mesh } from "meshes/Mesh";
import { BufferedGeometry } from "geometry/BufferedGeometry";
import { Material } from "materials/Material";
import { TypedArray } from "types/types";
import { vec3, vec2 } from "gl-matrix";
import { MtlLoader } from "./MtlLoader";

export interface ObjData {
    objects: { name: string; buffered_geometry: BufferedGeometry }[];
    materials: Material[];
}

enum VertexDataTraits {
    v = 1,
    vt = 2,
    vn = 4,
    vp = 8,
}

type RawObjData = {
    objects: {
        name: string;
        trait_flags: VertexDataTraits;
        data: {
            [key in VertexDataTraits]?: [number, number, number][];
        };

        groups: {
            name: string;
            material_name: string;
            faces: {
                face_ids: number[];
            }[];
        };
        //used for calculating normals that are not provided
        smoothing_groups?: {
            index: number;
            //index into groups.faces[faces_array_indices]
            faces_array_indices: number[];
        }[];
    }[];
};

let o: RawObjData = {
    objects: [
        {
            name: "cube",
            trait_flags: VertexDataTraits.v,
            data: {
                [VertexDataTraits.v]: [[1, 2, 3]],
            },
            groups: {
                name: "cube",
                material_name: "cubemtl",
                faces: [
                    {
                        face_ids: [1, 2, 3, 4],
                    },
                ],
            },
            //used for calculating normals that are not provided
            smoothing_groups: [
                {
                    index: 1,
                    //index into groups.faces[faces_array_indices]
                    faces_array_indices: [0],
                },
            ],
        },
    ],
};

export class ObjLoader extends FileLoader {
    public static async promise(file_name: string, base_url: string = this.Default_Base_URL): Promise<ObjData> {
        return new Promise<ObjData>((resolve) => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.text().then((s: string) => {
                    const data = ObjLoader.fromObjString(s, base_url);

                    resolve(data);
                });
            });
        });
    }

    private static async fromObjString(s: string, base_url: string = this.Default_Base_URL): Promise<ObjData> {
        const lines = s.split(/\r?\n/);
        console.log(lines);

        const raw_obj_data: RawObjData = { objects: [] };
        let materials: Promise<Map<string, Material>>;

        // for(let line of lines) parse_line(line);

        return {} as ObjData;

        // function parse_line(line: string) {
        //     const arr = line.split(" ");
        //     const nums = arr.map(Number);
        //     const first = arr[0];

        //     switch (first) {
        //         case "#": //comment
        //             break;
        //         case "mtllib":
        //             materials = MtlLoader.promise(arr[1], base_url)
        //             break;
        //         case "v":
        //             traits |= VertexDataTraits.v;
        //             vertices.push([nums[1], nums[2], nums[3]]);
        //             break;
        //         case "vt":
        //             traits |= VertexDataTraits.vt;
        //             tex_coords.push([nums[1], nums[2]]);
        //             break;
        //         case "vn":
        //             traits |= VertexDataTraits.vn;
        //             normals.push([nums[1], nums[2], nums[3]]);
        //             break;
        //         case "vp":
        //             throw "Not able to parse obj files with parameter space vertices (vp)";
        //         case "cstype":
        //             throw "Not able to parse obj files with rational or non-rational forms of curve or surface type (cstype)";
        //         case "f":
        //             let f1 = arr[1].split("/").map(Number);
        //             let f2 = arr[2].split("/").map(Number);
        //             let f3 = arr[3].split("/").map(Number);
        //             //let f4 = arr[4].split("/").map(Number);
        //             v_indices.push(f1[0], f2[0], f3[0]);
        //             vt_indices.push(f1[1], f2[1], f3[1]);
        //             vn_indices.push(f1[2], f2[2], f3[2]);
        //     }
        // }
    }
}

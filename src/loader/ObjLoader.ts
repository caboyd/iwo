import { FileLoader } from "./FileLoader";
import { AttributeType, Geometry } from "geometry/Geometry";
import { Mesh } from "meshes/Mesh";
import { BufferedGeometry } from "geometry/BufferedGeometry";
import { Material } from "materials/Material";
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

type RawObjDataArray = {
    objects: RawObjData[];
};

type RawObjData = {
    name: string;
    trait_flags: VertexDataTraits;
    data: {
        [VertexDataTraits.v]: [number, number, number][];
        [VertexDataTraits.vt]: [number, number][];
        [VertexDataTraits.vn]: [number, number, number][];
        // [VertexDataTraits.vp]: [number, number, number][];
    };

    groups: FaceGroup[];
    //used for calculating normals that are not provided
    smoothing_groups: SmoothingGroup[];
};

type SmoothingGroup = {
    index: number;
    //index into groups.faces[faces_array_indices]
    faces_array_indices: number[];
};

type FaceGroup = {
    name: string;
    material_name?: string;
    faces: Face[];
};

type Face = {
    v_indices: number[];
    vt_indices: number[];
    vn_indices: number[];
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

        const raw_obj_data_array: RawObjDataArray = { objects: [createEmptyObject("Default")] };
        let current_obj = raw_obj_data_array.objects[0];
        let current_group = current_obj.groups[0];
        let current_smoothing_group: SmoothingGroup | undefined = undefined;

        let materials: Promise<Map<string, Material>>;

        for (let line of lines) parse_line(line.trim());

        console.log(raw_obj_data_array);
        return {} as ObjData;

        function parse_line(line: string) {
            if (line.length === 0 || line[0] === "#") return;
            const arr = line.split(" ");
            const nums = arr.map(Number);
            const first = arr[0];

            switch (first) {
                case "#": //comment
                    break;
                case "o":
                    if (current_obj.name === "Default") current_obj.name = arr[1];
                    else {
                        current_obj = createEmptyObject(arr[1]);
                        raw_obj_data_array.objects.push(current_obj);
                    }
                    break;
                case "g":
                    if (current_group.name === "Default") current_group.name = arr[1];
                    else {
                        //new group
                        current_group = createEmptyGroup(arr[1]);
                        current_obj.groups.push(current_group);
                    }
                    break;
                case "usemtl":
                    current_group.material_name = arr[1];
                    break;
                case "mtllib":
                    materials = MtlLoader.promise(arr[1], base_url);
                    break;
                case "v":
                    current_obj.trait_flags |= VertexDataTraits.v;
                    current_obj.data[VertexDataTraits.v].push([nums[1], nums[2], nums[3]]);
                    break;
                case "vt":
                    current_obj.trait_flags |= VertexDataTraits.vt;
                    current_obj.data[VertexDataTraits.vt].push([nums[1], nums[2]]);
                    break;
                case "vn":
                    current_obj.trait_flags |= VertexDataTraits.vn;
                    current_obj.data[VertexDataTraits.vn].push([nums[1], nums[2], nums[3]]);
                    break;
                case "vp":
                    throw "Not able to parse obj files with parameter space vertices (vp)";
                case "cstype":
                    throw "Not able to parse obj files with rational or non-rational forms of curve or surface type (cstype)";
                case "s":
                    //sides
                    current_smoothing_group = {
                        index: Number(arr[1]),
                        faces_array_indices: [],
                    };
                    current_obj.smoothing_groups.push(current_smoothing_group);
                    break;
                case "f":
                    const new_face: Face = {
                        v_indices: [],
                        vt_indices: [],
                        vn_indices: [],
                    };
                    //remove "f" from array
                    const vertices = arr.slice(1);
                    for (const vertex of vertices) {
                        const values = vertex.split("/");
                        const v = Number(values[0]);
                        const vt = Number(values[1]);
                        const vn = Number(values[2]);
                        if (v) new_face.v_indices.push(v);
                        if (vt) new_face.vt_indices.push(vt);
                        if (vn) new_face.vn_indices.push(vn);
                    }
                    if (current_smoothing_group) {
                        current_smoothing_group.faces_array_indices.push(current_group.faces.length);
                    }
                    current_group.faces.push(new_face);
                    break;
            }
        }
    }
}

function createEmptyObject(name: string): RawObjData {
    return {
        name: name,
        trait_flags: 0,
        data: {
            [VertexDataTraits.v]: [],
            [VertexDataTraits.vt]: [],
            [VertexDataTraits.vn]: [],
            // [VertexDataTraits.vp]: [],
        },
        groups: [
            {
                name: "Default",
                faces: [],
            },
        ],
        smoothing_groups: [],
    };
}

function createEmptyGroup(name: string): FaceGroup {
    return {
        name: name,
        faces: [],
    };
}

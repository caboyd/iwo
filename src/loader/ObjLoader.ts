import { BufferedGeometry } from "geometry/BufferedGeometry";
import { Geometry, Group } from "geometry/Geometry";
import { Material } from "materials/Material";
import { FileLoader } from "./FileLoader";
import { MtlData, MtlLoader, MtlOptions } from "./MtlLoader";
import { StandardAttribute } from "geometry/attribute/StandardAttribute";

export interface ObjData {
    objects: { name: string; buffered_geometry: BufferedGeometry }[];
    materials?: Material | Material[] | undefined;
}

enum VertexDataTraits {
    v = 1,
    vt = 2,
    vn = 4,
    vp = 8,
}

type RawObjDataArray = RawObjData[];

type RawObjData = {
    name: string;
    trait_flags: VertexDataTraits;

    v: [number, number, number][];
    vt: [number, number][];
    vn: [number, number, number][];
    // vp: [number, number, number][];

    groups: FaceGroup[];
    //used for calculating normals that are not provided
    smoothing_groups: {
        [key: number]: number[];
    };
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

export type ObjOptions = MtlOptions;

export class ObjLoader extends FileLoader {
    public static async promise(
        file_name: string,
        base_url: string = this.Default_Base_URL,
        obj_options?: ObjOptions
    ): Promise<ObjData> {
        return new Promise<ObjData>((resolve) => {
            super.promise(file_name, base_url).then((response: Response) => {
                response.text().then((s: string) => {
                    const data = ObjLoader.fromObjString(s, base_url, obj_options);

                    resolve(data);
                });
            });
        });
    }

    private static async fromObjString(
        s: string,
        base_url: string = this.Default_Base_URL,
        obj_options?: ObjOptions
    ): Promise<ObjData> {
        const lines = s.split(/\r?\n/);

        const raw_obj_data_array: RawObjDataArray = [createEmptyObject("Default")];
        let current_obj = raw_obj_data_array[0];
        let current_group = current_obj.groups[0];
        let current_smoothing_group: number[] | undefined = undefined;

        let materials: MtlData | undefined = undefined;

        for (let line of lines) await parse_line(line.trim());

        return generateGeometry(raw_obj_data_array, materials);

        async function parse_line(line: string) {
            if (line.length === 0 || line[0] === "#") return;
            //split spaces of any size
            const arr = line.split(/\s+/);
            const nums = arr.map(Number);
            const first = arr[0];

            switch (first) {
                case "#": //comment
                    break;
                case "o":
                    if (current_obj.name === "Default") current_obj.name = arr[1];
                    else {
                        current_obj = createEmptyObject(arr[1]);
                        raw_obj_data_array.push(current_obj);
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
                    materials = await MtlLoader.promise(arr[1], base_url, obj_options);
                    break;
                case "v":
                    current_obj.trait_flags |= VertexDataTraits.v;
                    current_obj.v.push([nums[1], nums[2], nums[3]]);
                    break;
                case "vt":
                    current_obj.trait_flags |= VertexDataTraits.vt;
                    current_obj.vt.push([nums[1], nums[2]]);
                    break;
                case "vn":
                    current_obj.trait_flags |= VertexDataTraits.vn;
                    current_obj.vn.push([nums[1], nums[2], nums[3]]);
                    break;
                case "vp":
                    throw "Not able to parse obj files with parameter space vertices (vp)";
                case "cstype":
                    throw "Not able to parse obj files with rational or non-rational forms of curve or surface type (cstype)";
                case "s":
                    //sides
                    current_smoothing_group = [];
                    current_obj.smoothing_groups[Number(arr[1])] = current_smoothing_group;
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
                        current_smoothing_group.push(current_group.faces.length);
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
        v: [],
        vt: [],
        vn: [],
        // vp: [],

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

function generateGeometry(raw_obj_data_array: RawObjDataArray, materials?: MtlData): ObjData {
    let mats: Material | Material[] | undefined = materials
        ? Object.values(materials).map((mat) => mat.material)
        : undefined;
    if (mats && mats.length === 1) mats = mats[0];

    const result: ObjData = {
        objects: [],
        materials: mats,
    };

    for (const raw_obj_data of raw_obj_data_array) {
        const geom = new Geometry();
        geom.groups = [];
        const v_arr = [];
        const vt_arr = [];
        const vt_check = raw_obj_data.trait_flags & VertexDataTraits.vt;
        const vn_arr = [];
        const vn_check = raw_obj_data.trait_flags & VertexDataTraits.vn;
        let offset = 0;

        for (const group of raw_obj_data.groups) {
            const geom_group: Group = {
                offset: offset,
                count: 0,
                material_index: materials && group.material_name ? materials[group.material_name].index : 0,
            };
            let elements = 0;
            //TODO: Generate n-2 triangles
            for (const face of group.faces) {
                for (let i = 0; i < face.v_indices.length - 2; i++) {
                    elements += 3;
                    v_arr.push(...raw_obj_data.v[face.v_indices[0] - 1]);
                    v_arr.push(...raw_obj_data.v[face.v_indices[i + 1] - 1]);
                    v_arr.push(...raw_obj_data.v[face.v_indices[i + 2] - 1]);
                    if (vt_check) {
                        vt_arr.push(...raw_obj_data.vt[face.vt_indices[0] - 1]);
                        vt_arr.push(...raw_obj_data.vt[face.vt_indices[i + 1] - 1]);
                        vt_arr.push(...raw_obj_data.vt[face.vt_indices[i + 2] - 1]);
                    }
                    if (vn_check) {
                        vn_arr.push(...raw_obj_data.vn[face.vn_indices[0] - 1]);
                        vn_arr.push(...raw_obj_data.vn[face.vn_indices[i + 1] - 1]);
                        vn_arr.push(...raw_obj_data.vn[face.vn_indices[i + 2] - 1]);
                    }
                }
            }

            //update offset and count
            geom_group.count = elements;
            offset += elements;
            geom.groups.push(geom_group);
        }
        //build geom
        geom.attributes.set(StandardAttribute.Vertex.type, new Float32Array(v_arr));
        if (vt_check) geom.attributes.set(StandardAttribute.Tex_Coord.type, new Float32Array(vt_arr));
        if (vn_check) geom.attributes.set(StandardAttribute.Normal.type, new Float32Array(vn_arr));
        result.objects.push({
            name: raw_obj_data.name,
            buffered_geometry: BufferedGeometry.fromGeometry(geom),
        });
    }

    return result;
}

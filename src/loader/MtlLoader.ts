import { FileLoader } from "./FileLoader";
import { Material, MaterialOptions } from "@materials/Material";
import { ImageLoader } from "./ImageLoader";
import { vec3 } from "gl-matrix";
import { PBRMaterial } from "@materials/PBRMaterial";

type RawMtlData = {
    material_index: number;
    Ns?: number;
    Ni?: number;
    d?: number;
    Tr?: number;
    Tf?: [number, number, number];
    illum?: number;
    Ka?: [number, number, number];
    Kd?: [number, number, number];
    Ks?: [number, number, number];
    Ke?: [number, number, number];
    map_Ka?: string;
    map_Ka_index?: number;
    map_Kd?: string;
    map_Kd_index?: number;
    map_Ks?: string;
    map_Ks_index?: number;
    map_Ke?: string;
    map_Ke_index?: number;
};

export type MtlData = {
    [name: string]: {
        index: number;
        material: Material;
    };
};

export type MtlOptions = MaterialOptions;

export class MtlLoader extends FileLoader {
    public static async promise(
        file_name: string,
        base_url: string = this.Default_Base_URL,
        mtl_options?: MtlOptions
    ): Promise<MtlData> {
        const response = await super.promise(file_name, base_url);
        const text = await response.text();
        const data = MtlLoader.fromMtlString(text, base_url, mtl_options);
        return data;
    }

    private static fromMtlString(s: string, base_url = this.Default_Base_URL, mtl_options?: MtlOptions): MtlData {
        const lines = s.split(/\r?\n/);

        const mtl_data = MtlLoader.toMtlData(lines);

        //find unique images and load them
        const unique_images: string[] = [];
        for (let [name, value] of mtl_data) {
            if (value.map_Ka) {
                if (!unique_images.includes(value.map_Ka)) unique_images.push(value.map_Ka);
                value.map_Ka_index = unique_images.indexOf(value.map_Ka);
            }
            if (value.map_Kd) {
                if (!unique_images.includes(value.map_Kd)) unique_images.push(value.map_Kd);
                value.map_Kd_index = unique_images.indexOf(value.map_Kd);
            }
            if (value.map_Ks) {
                if (!unique_images.includes(value.map_Ks)) unique_images.push(value.map_Ks);
                value.map_Ks_index = unique_images.indexOf(value.map_Ks);
            }
            if (value.map_Ke) {
                if (!unique_images.includes(value.map_Ke)) unique_images.push(value.map_Ke);
                value.map_Ke_index = unique_images.indexOf(value.map_Ke);
            }
        }
        const images = ImageLoader.loadAllBackground(unique_images, base_url);

        const m: MtlData = {};
        //create materials
        for (let [name, value] of mtl_data) {
            //we dont have ambient so color is diffuse + ambient
            const color = value.Kd ?? [0, 0, 0];
            if (value.Ka) vec3.add(color, color, value.Ka);
            const emmisive = value.Ke ?? [1, 1, 1];
            //use specular average color as metallic
            const metallic = value.Ks ? (value.Ks[0] + value.Ks[1] + value.Ks[2]) / 3 : 0;
            //use specular exponent as rougness
            const roughness = value.Ns ? 1 - Math.min(Math.pow(Math.log10(value.Ns), 2) / 9, 0.975) : 0;

            const mat = new PBRMaterial({
                albedo_color: color,
                metallic: metallic,
                roughness: roughness,
                emissive_factor: emmisive,
                ...mtl_options,
            });
            if (value.map_Kd_index !== undefined) mat.albedo_image = images[value.map_Kd_index];
            if (value.map_Ke_index !== undefined) mat.emissive_image = images[value.map_Ke_index];
            m[name] = { index: value.material_index, material: mat };
        }

        return m;
    }

    private static toMtlData(lines: string[]): Map<string, RawMtlData> {
        const m: Map<string, RawMtlData> = new Map();
        let current_object = "";
        let current_mtldata: RawMtlData = {} as RawMtlData;

        let getMaterialIndex = ((m) => {
            return function () {
                m++;
                return m;
            };
        })(-1);

        for (let line of lines) {
            const arr = line.trim().split(" ");
            const first = arr[0] as string;

            switch (first) {
                case "newmtl":
                    current_object = arr[1];
                    current_mtldata = { material_index: getMaterialIndex() } as RawMtlData;
                    m.set(current_object, current_mtldata);
                    break;
                case "Ns":
                case "Ni":
                case "d":
                case "Tr":
                case "illum":
                    current_mtldata[first] = Number(arr[1]);
                    break;
                case "Tf":
                case "Ka":
                case "Kd":
                case "Ks":
                case "Ke":
                    current_mtldata[first] = [Number(arr[1]), Number(arr[2]), Number(arr[3])];
                    break;
                case "map_Ka":
                case "map_Kd":
                case "map_Ks":
                case "map_Ke":
                    current_mtldata[first] = arr[1];
                    break;
            }
        }
        return m;
    }
}

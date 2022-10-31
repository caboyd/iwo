import { FileLoader } from "./FileLoader";
import { Material } from "materials/Material";
import { ImageLoader } from "./ImageLoader";
import { vec3 } from "gl-matrix";
import { PBRMaterial } from "/materials/PBRMaterial";

type MtlData = {
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

export class MtlLoader extends FileLoader {
    public static async promise(
        file_name: string,
        base_url: string = this.Default_Base_URL
    ): Promise<Map<string, Material>> {
        const response = await super.promise(file_name, base_url);
        const text = await response.text();
        const data = MtlLoader.fromMtlString(text, base_url);
        return data;
    }

    private static fromMtlString(s: string, base_url = this.Default_Base_URL): Map<string, Material> {
        const lines = s.split(/\r?\n/);

        const mtl_data = MtlLoader.toMtlData(lines);

        //find unique images and load them
        const unique_images: string[] = [];
        for (let [key, value] of mtl_data) {
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

        const m: Map<string, Material> = new Map();
        //create materials
        for (let [key, value] of mtl_data) {
            //we dont have ambient so color is diffuse + ambient
            const color = value.Kd || vec3.create();
            if (value.Ka) vec3.add(color, color, value.Ka);
            const emmisive = value.Ke;
            //use specular average color as metallic 
            const metallic = value.Ks ? ((value.Ks[0] + value.Ks[1] + value.Ks[2]) / 3) : 0;
            //use specular exponent as rougness
            const roughness = value.Ns ? (1 - Math.max(value.Ns / 1000, 0.975)) : 0;
    
            const mat = new PBRMaterial(color, metallic, roughness, undefined, emmisive);
            if (value.map_Kd_index !== undefined) mat.albedo_image = images[value.map_Kd_index];
            if (value.map_Ke_index !== undefined) mat.emissive_image = images[value.map_Ke_index];
            m.set(key, mat);
        }

        return m;
    }

    private static toMtlData(lines: string[]): Map<string, MtlData> {
        const m: Map<string, MtlData> = new Map();
        let current_object = "";
        let current_mtldata: MtlData = {} as MtlData;

        for (let line of lines) {
            const arr = line.trim().split(" ");
            const first = arr[0] as string;

            switch (first) {
                case "newmtl":
                    current_object = arr[1];
                    current_mtldata = {} as MtlData;
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

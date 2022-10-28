import { FileLoader } from "./FileLoader";
import { Material } from "materials/Material";
import { ImageLoader } from "./ImageLoader";
import { BasicMaterial } from "materials/BasicMaterial";
import { vec3 } from "gl-matrix";

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
};

export class MtlLoader extends FileLoader {
    public static async promise(file_name: string, base_url: string = this.Default_Base_URL): Promise<Map<string,Material>> {
        const response = await super.promise(file_name, base_url);
        const text = await response.text();
        const data = MtlLoader.fromMtlString(text);
        return data;
    }

    private static fromMtlString(s: string, float32Array = Float32Array): Map<string,Material> {
        const lines = s.split(/\r?\n/);

        const mtl_data = MtlLoader.toMtlData(lines);

        //find unique images and load them
        const unique_images:string[] = [];
        for( let [key, value] of mtl_data){
            if(value.map_Ka)
            {
                if(!unique_images.includes(value.map_Ka)) unique_images.push(value.map_Ka)
                value.map_Ka_index = unique_images.indexOf(value.map_Ka);
            }
            if(value.map_Kd){
                if(!unique_images.includes(value.map_Kd)) unique_images.push(value.map_Kd)
                value.map_Kd_index = unique_images.indexOf(value.map_Kd);
            } 
           
           
        }
        const images = ImageLoader.loadAllBackground(unique_images);

        const m:Map<string,Material>= new Map();
        //create materials
        for(let [key,value] of mtl_data){
            const color = value.Kd || vec3.create()
            if(value.Ka) vec3.add(color,color,value.Ka)
            const mat = new BasicMaterial(color)
            if(value.map_Kd_index) mat.albedo_image = images[value.map_Kd_index]
            m.set(key,mat);
        }

        return m;
    }

    private static toMtlData(lines: string[]): Map<string, MtlData> {
        const m: Map<string, MtlData> = new Map();
        let current_object = "";
        let current_mtldata: MtlData = {} as MtlData;

        for (let line of lines) {
            const arr = line.split(" ");
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
                    current_mtldata[first] = arr[1];
                    break;
            }
        }
        return m;
    }
}

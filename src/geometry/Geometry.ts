import { TypedArray } from "types/types";
import { BufferedGeometry } from "./BufferedGeometry";
import { DrawMode } from "graphics/WebglConstants";

//TODO: Change to match glTF https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshes
export enum AttributeType {
    Vertex = 0,
    Tex_Coord = 1,
    Normal = 2,
    Tangent = 3,
    Bitangent = 4,
}

export enum LineAttributeType {
    position = 0,
    point_a = 1,
    point_b = 2,
    color_a = 3,
    color_b = 4,
}





// export const AttributeTypeValues: ReadonlyArray<number> = Object.keys(AttributeType)
//     .filter((value) => !isNaN(Number(value)))
//     .map((value) => Number(value));

/*
    A Group is a subset of a Mesh that
    wants to be drawn separately because it uses a different material
 */
export interface Group {
    offset: number;
    count: number;
    material_index: number;
}

export class Geometry {
    public indices: Uint16Array | Uint32Array | undefined;
    public attributes: Map<AttributeType, TypedArray>;
    public groups?: Group[];
    public interleaved_attributes: Float32Array | undefined;
    public draw_mode: DrawMode = DrawMode.TRIANGLES;

    public constructor() {
        this.attributes = new Map<AttributeType, TypedArray>();
        this.groups = [];
    }

    public getBufferedGeometry?(): BufferedGeometry;

    //TODO
    //Bounding Sphere
    //Bounding Box (AABB)
}

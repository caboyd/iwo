import TypedArray = NodeJS.TypedArray;
import { BufferedGeometry } from "geometry/BufferedGeometry";

export enum AttributeType {
    Vertex = 0,
    Tex_Coord = 1,
    Normal = 2,
    Tangent = 3,
    Bitangent = 4,
}
/*

    A Group is a subset of a Mesh that
    wants to be drawn separately because it uses a different material
 */
export interface Group {
    offset: number;
    count: number;
    material_index: number;
}

export interface Geometry {
    indices: Uint16Array | Uint32Array | undefined;
    attributes: Map<AttributeType, TypedArray>;
    groups: Group[];

    interleaved_attributes: Float32Array | undefined;

    getBufferedGeometry?(): BufferedGeometry;

    //TODO
    //Bounding Sphere
    //Bounding Box (AABB)
}

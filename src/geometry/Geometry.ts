/*
    A Group is a subset of a Mesh that
    wants to be drawn separately because it uses a different material
 */

export enum AttributeType {
    Vertex = 1,
    Tex_Coords = 2,
    Normals = 4,
    Tangents = 8,
    Bitangents = 16
}

export interface Group {
    offset: number;
    count: number;
    material_index: number;
}

export interface Geometry {
    indices: Uint16Array | Uint32Array | undefined;
    attribute_flags: number;
    attributes: Map<AttributeType, ArrayBufferView>;
    groups: Group[];

    isInterleaved: boolean;
    interleaved_attributes: Float32Array;
    //Bounding Sphere

    //Bounding Box (AABB)
}

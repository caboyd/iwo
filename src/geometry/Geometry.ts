import { glComponentType } from "graphics/WebglConstants";
import TypedArray = NodeJS.TypedArray;

export enum AttributeType {
    Vertex,
    Tex_Coord,
    Normal,
    Tangent,
    Bitangent,
}

//Default assumes index buffer is buffer_view_index 0
export namespace DefaultAttribute {
    export const SingleBufferApproach = [DefaultAttribute.Vertex, DefaultAttribute.Normal, DefaultAttribute.Tex_Coord];
    export const MultiBufferApproach = [
        { ...DefaultAttribute.Vertex, ...{ buffer_index: 0 } },
        { ...DefaultAttribute.Normal, ...{ buffer_index: 1 } },
        { ...DefaultAttribute.Tex_Coord, ...{ buffer_index: 2 } },
    ];
    export const Vertex: Attribute = {
        type: AttributeType.Vertex,
        enabled: true,
        buffer_index: 0,
        component_type: 5126, // FLOAT
        component_count: 3,
        data_type: "VEC3",
    };
    export const Normal: Attribute = {
        type: AttributeType.Normal,
        enabled: true,
        buffer_index: 0,
        component_type: 5126, // FLOAT
        component_count: 3,
        data_type: "VEC3",
    };
    export const Tex_Coord: Attribute = {
        type: AttributeType.Tex_Coord,
        enabled: true,
        buffer_index: 0,
        component_type: 5126, // FLOAT
        component_count: 2,
        data_type: "VEC2",
    };
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

export interface GeometryBuffer {
    buffer: TypedArray;
    //ARRAY_BUFFER | ELEMENT_ARRAY_BUFFER
    target: 34962 | 34963;
}

export interface Attribute {
    type: AttributeType;
    enabled?: boolean;
    buffer_index: number;
    byte_offset?: number;
    byte_stride?: number;
    // eslint-disable-next-line prettier/prettier
    component_type: glComponentType;
    component_count: 1 | 2 | 3 | 4 | 9 | 16;
    //SCALAR | VEC2 | VEC3 | VEC4 | MAT2 | MAT3 | MAT4
    data_type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
    normalized?: boolean;
}
export interface Geometry {
    indices: Uint16Array | Uint32Array | undefined;
    attributes: Map<AttributeType, TypedArray>;
    groups: Group[];

    isInterleaved: boolean;
    interleaved_attributes: Float32Array | undefined;

    getBufferedGeometry?(): BufferedGeometry;

    //TODO
    //Bounding Sphere
    //Bounding Box (AABB)
}

export interface BufferedGeometry {
    attributes: Attribute[];
    index_buffer?: GeometryBuffer;
    buffers: GeometryBuffer[];
    groups: Group[];

    //Bounding Sphere

    //Bounding Box (AABB)
}

export function isBufferedGeometry(item: any): item is BufferedGeometry {
    return item.buffers && item.attributes && item.groups;
}

class SampleGeometryIndexed implements BufferedGeometry {
    public attributes: Attribute[];
    public index_buffer?: GeometryBuffer;
    public buffers: GeometryBuffer[];
    public groups: Group[];

    public constructor() {
        this.attributes = DefaultAttribute.SingleBufferApproach;
        this.buffers = [];
        this.groups = [];
    }
}

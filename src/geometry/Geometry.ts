import { DrawMode } from "graphics/WebglConstants";
import { TypedArray } from "types/types";
import { AttributeType, Attribute } from "./attribute/Attribute";
import { BufferedGeometry } from "./BufferedGeometry";


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

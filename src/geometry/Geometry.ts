import { TypedArray } from "@customtypes/types";
import { DrawMode } from "@graphics/WebglConstants";
import { Attribute } from "../graphics/attribute/Attribute";

export interface Group {
    offset: number;
    count: number;
    material_index: number;
}

export interface Geometry {
    attributes: Record<string, Attribute>;
    buffers: TypedArray[];
    index_buffer?: Uint16Array | Uint32Array;
    groups?: Group[];
    draw_mode: DrawMode;
    count: number;
    instances?: number;
}

import { TypedArray } from "@customtypes/types";
import { DrawMode, GL } from "@graphics/WebglConstants";
import { Attribute } from "./attribute/Attribute";
import { StandardAttribute } from "./attribute/StandardAttribute";
import { Geometry, Group } from "./Geometry";

export class QuadGeometry implements Geometry {
    attributes: Record<string, Attribute>;
    buffers: TypedArray[];
    index_buffer?: Uint16Array | Uint32Array | undefined;
    groups?: Group[] | undefined;
    draw_mode: DrawMode;
    count: number;
    instances?: number | undefined;

    constructor() {
        this.attributes = {
            [StandardAttribute.Position.name]: StandardAttribute.Position.createAttribute(),
            [StandardAttribute.Tex_Coord.name]: StandardAttribute.Tex_Coord.createAttribute({ buffer_index: 1 }),
        };
        this.buffers = [
            new Float32Array([-1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0]),
            new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]),
        ];
        this.count = 4;
        this.draw_mode = GL.TRIANGLE_STRIP;
    }
}

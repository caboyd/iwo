import { TypedArray } from "@customtypes/types";
import { DrawMode, GL } from "@graphics/WebglConstants";
import { vec2 } from "gl-matrix";
import { Attribute } from "../graphics/attribute/Attribute";
import { StandardAttribute } from "../graphics/attribute/StandardAttribute";
import { Geometry, Group } from "./Geometry";

export class QuadGeometry implements Geometry {
    attributes: Record<string, Attribute>;
    buffers: TypedArray[];
    index_buffer?: Uint16Array | Uint32Array | undefined;
    groups?: Group[] | undefined;
    draw_mode: DrawMode;
    count: number;
    instances?: number | undefined;

    constructor(scale?: vec2) {
        this.attributes = {
            [StandardAttribute.Position.name]: StandardAttribute.Position.createAttribute(),
            [StandardAttribute.Tex_Coord.name]: StandardAttribute.Tex_Coord.createAttribute({ buffer_index: 1 }),
            [StandardAttribute.Normal.name]: StandardAttribute.Normal.createAttribute({ buffer_index: 2 }),
        };
        let verts = [];
        if (scale) {
            verts = [
                -1.0 * scale[0],
                1.0 * scale[1],
                0.0,
                -1.0 * scale[0],
                -1.0 * scale[1],
                0.0,
                1.0 * scale[0],
                1.0 * scale[1],
                0.0,
                1.0 * scale[0],
                -1.0 * scale[1],
                0.0,
            ];
        } else {
            verts = [-1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0];
        }

        this.buffers = [
            new Float32Array(verts),
            new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]),
            new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
        ];
        this.count = 4;
        this.draw_mode = GL.TRIANGLE_STRIP;
    }
}

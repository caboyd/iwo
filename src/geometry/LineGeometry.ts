import { TypedArray } from "@customtypes/types";
import { Geometry, Group } from "@geometry/Geometry";
import { DrawMode } from "@graphics/WebglConstants";
import { vec3 } from "gl-matrix";
import { Attribute } from "../graphics/attribute/Attribute";
import { LineAttribute as LA } from "../graphics/attribute/LineAttribute";

export interface LineOptions {
    type: "lines" | "line strip";
    line_cap_resolution: number;
}

const DefaultLineOptions: LineOptions = {
    type: "line strip",
    line_cap_resolution: 16,
};

export class LineGeometry implements Geometry {
    public opt: LineOptions;
    attributes: Record<string, Attribute>;
    buffers: TypedArray[];
    index_buffer?: Uint16Array | Uint32Array | undefined;
    groups?: Group[] | undefined;
    count: number;
    instances: number;
    draw_mode: DrawMode;

    private line_segment_verts = [
        [0, -0.5, 0],
        [0, -0.5, 1],
        [0, 0.5, 1],
        [0, -0.5, 0],
        [0, 0.5, 1],
        [0, 0.5, 0],
    ];

    constructor(points: vec3[] | number[], LineOptions?: Partial<LineOptions>) {
        this.opt = { ...DefaultLineOptions, ...LineOptions };
        this.draw_mode = DrawMode.TRIANGLES;
        this.attributes = {};
        this.buffers = [];

        const line_segment_flat = this.line_segment_verts.flat() as number[];
        const resolution = this.opt.line_cap_resolution;

        // Add the left cap.
        for (let step = 0; step < resolution; step++) {
            const theta0 = Math.PI / 2 + ((step + 0) * Math.PI) / resolution;
            const theta1 = Math.PI / 2 + ((step + 1) * Math.PI) / resolution;
            line_segment_flat.push(0, 0, 0);
            line_segment_flat.push(0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 0);
            line_segment_flat.push(0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 0);
        }
        // Add the right cap.
        for (let step = 0; step < resolution; step++) {
            const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
            const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
            line_segment_flat.push(0, 0, 1);
            line_segment_flat.push(0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 1);
            line_segment_flat.push(0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 1);
        }

        this.buffers.push(new Float32Array(line_segment_flat));
        const points_flat = points.flat() as number[];
        this.buffers.push(new Float32Array(points_flat));

        this.count = line_segment_flat.length / 3;
        this.instances = points_flat.length / 6;
        if (this.opt.type === "line strip") this.instances = points_flat.length / 3 - 1;

        this.attributes = {
            [LA.position.name]: LA.position.createAttribute(),
            [LA.point_a.name]: LA.point_a.createAttribute({
                byte_offset: Float32Array.BYTES_PER_ELEMENT * 0,
                byte_stride: this.opt.type === "lines" ? Float32Array.BYTES_PER_ELEMENT * 6 : 0,
            }),
            [LA.point_b.name]: LA.point_b.createAttribute({
                byte_offset: Float32Array.BYTES_PER_ELEMENT * 3,
                byte_stride: this.opt.type === "lines" ? Float32Array.BYTES_PER_ELEMENT * 6 : 0,
            }),
        };
    }
}

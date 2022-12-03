import { TypedArray } from "@customtypes/types";
import { Geometry, Group } from "@geometry/Geometry";
import { DrawMode } from "@graphics/WebglConstants";
import { vec3 } from "gl-matrix";
import { Attribute } from "../graphics/attribute/Attribute";
import { LineAttribute as LA } from "../graphics/attribute/LineAttribute";
import { StandardAttribute } from "@graphics/attribute/StandardAttribute";

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

    static fromGeometry(geometry: Geometry): LineGeometry {
        //assert buffer 0 is just verts
        const vert_attr = geometry.attributes[StandardAttribute.Position.name];
        if (vert_attr.byte_stride !== 0) throw "LineGeometry.fromGeometry failed. vertices must be separate in buffer";

        //convert every triangle into 3 line segments
        const verts = geometry.buffers[vert_attr.buffer_index];
        const lines = new Array(verts.length * 2);

        if (geometry.index_buffer) {
            const inds = geometry.index_buffer;
            for (let i = 0, j = 0; i < geometry.index_buffer.length - 3; i += 3, j += 18) {
                //first line segment
                lines[j + 0] = verts[3 * inds[i] + 0];
                lines[j + 1] = verts[3 * inds[i] + 1];
                lines[j + 2] = verts[3 * inds[i] + 2];
                lines[j + 3] = verts[3 * inds[i + 1] + 0];
                lines[j + 4] = verts[3 * inds[i + 1] + 1];
                lines[j + 5] = verts[3 * inds[i + 1] + 2];
                //second line segment
                lines[j + 6] = verts[3 * inds[i + 1] + 0];
                lines[j + 7] = verts[3 * inds[i + 1] + 1];
                lines[j + 8] = verts[3 * inds[i + 1] + 2];
                lines[j + 9] = verts[3 * inds[i + 2] + 0];
                lines[j + 10] = verts[3 * inds[i + 2] + 1];
                lines[j + 11] = verts[3 * inds[i + 2] + 2];
                //third line segment
                lines[j + 12] = verts[3 * inds[i + 2] + 0];
                lines[j + 13] = verts[3 * inds[i + 2] + 1];
                lines[j + 14] = verts[3 * inds[i + 2] + 2];
                lines[j + 15] = verts[3 * inds[i + 0] + 0];
                lines[j + 16] = verts[3 * inds[i + 0] + 1];
                lines[j + 17] = verts[3 * inds[i + 0] + 2];
            }
        } else {
            for (let i = 0, j = 0; i < verts.length - 9; i += 9, j += 18) {
                //first line segment
                lines[j + 0] = verts[i + 0];
                lines[j + 1] = verts[i + 1];
                lines[j + 2] = verts[i + 2];
                lines[j + 3] = verts[i + 3];
                lines[j + 4] = verts[i + 4];
                lines[j + 5] = verts[i + 5];
                //second line segment
                lines[j + 6] = verts[i + 3];
                lines[j + 7] = verts[i + 4];
                lines[j + 8] = verts[i + 5];
                lines[j + 9] = verts[i + 6];
                lines[j + 10] = verts[i + 7];
                lines[j + 11] = verts[i + 8];
                //third line segment
                lines[j + 12] = verts[i + 6];
                lines[j + 13] = verts[i + 7];
                lines[j + 14] = verts[i + 8];
                lines[j + 15] = verts[i + 0];
                lines[j + 16] = verts[i + 1];
                lines[j + 17] = verts[i + 2];
            }
        }

        return new LineGeometry(lines, { type: "lines", line_cap_resolution: 4 });
    }
}

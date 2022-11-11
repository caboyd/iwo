import { Geometry } from "geometry/Geometry";
import { vec3 } from "gl-matrix";
import { DrawMode, GL } from "graphics/WebglConstants";
import { LineAttribute as LA } from "./attribute/LineAttribute";
import { BufferedGeometry } from "./BufferedGeometry";

export interface LineOptions {
    type: "lines" | "line strip";
    line_cap_resolution: number;
}

const DefaultLineOptions: LineOptions = {
    type: "line strip",
    line_cap_resolution: 16,
};

export class LineGeometry extends Geometry {
    public opt: LineOptions;
    public instances: number;

    private line_segment_verts = [
        [0, -0.5, 0],
        [0, -0.5, 1],
        [0, 0.5, 1],
        [0, -0.5, 0],
        [0, 0.5, 1],
        [0, 0.5, 0],
    ];

    constructor(points: vec3[] | number[], LineOptions?: Partial<LineOptions>) {
        super();
        this.opt = { ...DefaultLineOptions, ...LineOptions };
        this.draw_mode = DrawMode.TRIANGLES;

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

        const pos_buff = new Float32Array(line_segment_flat);
        this.attributes.set(LA.Name.position, pos_buff);

        const points_flat = points.flat() as number[];
        this.instances = points_flat.length / 6;
        if (this.opt.type === "line strip") this.instances = points_flat.length / 3 - 1;
        const point_a_buff = new Float32Array(points_flat);
        this.attributes.set(LA.Name.point_a, point_a_buff);
    }

    public getBufferedGeometry(): BufferedGeometry {
        const pos_buf = this.attributes.get(LA.Name.position)!;
        const point_buf = this.attributes.get(LA.Name.point_a)!;

        const attrs = {
            [LA.position.name]: LA.position.createAttribute({
                divisor: 0,
            }),
            [LA.point_a.name]: LA.point_a.createAttribute({
                divisor: 1,
                buffer_index: 1,
                byte_offset: Float32Array.BYTES_PER_ELEMENT * 0,
                byte_stride: this.opt.type === "lines" ? Float32Array.BYTES_PER_ELEMENT * 6 : 0,
            }),
            [LA.point_b.name]: LA.point_b.createAttribute({
                divisor: 1,
                buffer_index: 1,
                byte_offset: Float32Array.BYTES_PER_ELEMENT * 3,
                byte_stride: this.opt.type === "lines" ? Float32Array.BYTES_PER_ELEMENT * 6 : 0,
            }),
        };

        return {
            attributes: attrs,
            buffers: [
                { buffer: pos_buf, target: GL.ARRAY_BUFFER },
                { buffer: point_buf, target: GL.ARRAY_BUFFER, usage: GL.STATIC_DRAW },
            ],
            draw_mode: this.draw_mode,
            buffer_format: "concatenated",
            instances: this.instances,
        } as BufferedGeometry;
    }
}

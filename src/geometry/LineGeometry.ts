import { Geometry, AttributeType } from "geometry/Geometry";
import { vec3 } from "gl-matrix";
import { DrawMode, GL } from "graphics/WebglConstants";
import { BufferedGeometry, DefaultAttribute } from "./BufferedGeometry";

export interface LineOptions {
    type: "lines" | "line strip";
    world_space: boolean;
    width: number;
}

const DefaultLineOptions: LineOptions = {
    type: "line strip",
    world_space: true,
    width: 1,
};

export class LineGeometry extends Geometry {
    public opt: LineOptions;

    private line_segment_verts = [
        [0, -0.5],
        [1, -0.5],
        [1, 0.5],
        [0, -0.5],
        [1, 0.5],
        [0, 0.5],
    ];

    constructor(points: vec3[] | number[], LineOptions?: Partial<LineOptions>) {
        super();
        this.opt = { ...DefaultLineOptions, ...LineOptions };
        this.draw_mode = DrawMode.LINES;
        const flat = points.flat() as number[];
        const vert_buff = new Float32Array(flat);
        this.attributes.set(AttributeType.Vertex, vert_buff);
    }

    public getBufferedGeometry(): BufferedGeometry {
        const attrib = DefaultAttribute.SingleBufferApproach();
        const v_buf = this.attributes.get(AttributeType.Vertex);

        return {
            attributes: attrib,
            index_buffer: undefined,
            buffers: [{ buffer: v_buf, target: GL.ARRAY_BUFFER }],
            groups: this.groups,
            draw_mode: this.draw_mode,
        } as BufferedGeometry;
    }
}

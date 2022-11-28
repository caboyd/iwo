import { TypedArray } from "@customtypes/types";
import { StandardAttribute } from "@graphics/attribute/StandardAttribute";
import { DrawMode, GL } from "@graphics/WebglConstants";
import { Attribute } from "../graphics/attribute/Attribute";
import { Geometry, Group } from "./Geometry";

enum Order {
    x = 0,
    y = 1,
    z = 2,
}

export class PlaneGeometry implements Geometry {
    attributes: Record<string, Attribute>;
    buffers: TypedArray[];
    index_buffer?: Uint32Array | Uint16Array | undefined;
    groups?: Group[] | undefined;
    draw_mode: DrawMode;
    count: number;
    instances?: number | undefined;

    /**
     * @param {boolean} stretch_texture true stretches texture across segments, false repeats texture
     */
    public constructor(
        width: number = 1,
        depth: number = 1,
        width_segments: number = 1,
        depth_segments: number = 1,
        stretch_texture: boolean = true
    ) {
        this.attributes = {};
        this.buffers = [];
        this.draw_mode = GL.TRIANGLES;

        const width_segs = Math.floor(width_segments) || 1;
        const depth_segs = Math.floor(depth_segments) || 1;

        let top = depth > 0 && width > 0 ? (depth_segs + 1) * (width_segs + 1) : 0;

        const total_verts = top;

        top = depth_segs * width_segs;
        const total_indices = 6 * top;

        let index_size = 2;
        if (total_verts >= 65536) {
            this.index_buffer = new Uint32Array(total_indices);
            index_size = 4;
        } else this.index_buffer = new Uint16Array(total_indices);
        this.count = total_indices;

        const indices = this.index_buffer;

        const verts = new Float32Array(total_verts * 3);

        const interleaved = new Float32Array(total_verts * 14);
        const groups: Group[] = [];

        let ptr = 0;
        let i_ptr = 0;
        let interleaved_ptr = 0;
        let vertex_count = 0;

        if (depth !== 0 && width !== 0) {
            //Build Top Side
            buildSide(Order.x, Order.z, Order.y, width, width_segs, depth, depth_segs, 0, 1, -1, 0);
        }

        this.buffers.push(verts);
        this.buffers.push(interleaved);
        this.groups = groups;

        this.attributes = StandardAttribute.SeparatePostionPlusInterleavedRemainingApproach();

        /**
         * Fills the Arrays for one side of a cube
         * Fills vertices, normals, texture_coords, tangents, and indices
         *
         * @modifies {ptr} ptr is incremented 3 for each vertex
         * @modifies {i_ptr} i_ptr is incremented 3 for each indices
         * @modifies {vertex_count} is incremented by the number of vertices
         * @modifies {verts} values are placed at the index of ptr
         * @modifies {indices} values are placed at the index of i_ptr
         *
         * @param {Order} x_order - the dimension going from left to right
         * @param {Order} y_order - the dimension going bottom to top
         * @param {Order} z_order - the dimension of the plane
         * @param {number} horizontal_size - the width of the plane
         * @param {number} horizontal_steps - the number of sections per plane
         * @param {number} vertical_size - this height of the plane
         * @param {number} vertical_steps - the number of sections per plane
         * @param {number} plane - the position in the dimension of the plane
         * @param {number} x_dir - (-1 or 1) the direction of positive x ( 1 mean x grows to the right)
         * @param {number} y_dir - (-1 or 1) the direction of positive y ( 1 mean y grows to the top)
         * @param {number} mat_index - material index for this side
         */
        function buildSide(
            x_order: Order,
            y_order: Order,
            z_order: Order,
            horizontal_size: number,
            horizontal_steps: number,
            vertical_size: number,
            vertical_steps: number,
            plane: number,
            x_dir: number,
            y_dir: number,
            mat_index: number = 0
        ): void {
            //Construct Vertices For this Side
            const half_horizontal = horizontal_size / 2;
            const half_vertical = vertical_size / 2;

            const horizontal_step = horizontal_size / horizontal_steps;
            const vertical_step = vertical_size / vertical_steps;

            //The start_vertex is the first vertex the indices array will use
            const start_vertex = vertex_count;

            for (let x = -half_horizontal, i = 0; i <= horizontal_steps; x += horizontal_step, i++) {
                for (let y = -half_vertical, j = 0; j <= vertical_steps; y += vertical_step, j++) {
                    //The X,Y,Z Coords are different based on the side
                    const px = ptr + x_order;
                    const py = ptr + y_order;
                    const pz = ptr + z_order;

                    const ipx = interleaved_ptr + x_order;
                    const ipy = interleaved_ptr + y_order;
                    const ipz = interleaved_ptr + z_order;

                    //The X coords may go from left to right or right to left
                    verts[px] = x * x_dir;

                    //The Y coords may go from bottom to top or top to bottom
                    verts[py] = y * y_dir;
                    //The Z coordinate is the same for a side
                    verts[pz] = plane;

                    //If stretched then texture_coords go from 0 to 1.
                    //If not stretched texture_coords go above 1;
                    interleaved[interleaved_ptr + 0] = stretch_texture ? (i * horizontal_step) / horizontal_size : i;
                    interleaved[interleaved_ptr + 1] = stretch_texture
                        ? 1 - (j * vertical_step) / vertical_size
                        : 1 - j;

                    //The normal is just 1 in the direction of the side
                    interleaved[ipx + 2] = 0;
                    interleaved[ipy + 2] = 0;
                    interleaved[ipz + 2] = plane >= 0 ? 1 : -1;

                    //The tangent is any vector orthogonal to the normal
                    interleaved[ipx + 5] = x_dir;
                    interleaved[ipy + 5] = 0;
                    interleaved[ipz + 5] = 0;

                    //The bitangent is any vector orthogonal to the normal and tangent
                    interleaved[ipx + 8] = 0;
                    interleaved[ipy + 8] = y_dir;
                    interleaved[ipz + 8] = 0;

                    //Processed one vertex
                    ptr += 3;
                    interleaved_ptr += 11;
                    vertex_count++;
                }
            }

            //INDICES
            for (let i = 0; i < horizontal_steps; i++) {
                for (let j = 0; j < vertical_steps; j++) {
                    //The Vertex indices of the 4 corners we need for this quad
                    const lower_left = start_vertex + (vertical_steps + 1) * i + j;
                    const lower_right = start_vertex + (vertical_steps + 1) * (i + 1) + j;
                    const upper_left = lower_left + 1;
                    const upper_right = lower_right + 1;

                    //Counter Clockwise Triangles
                    //Triangle 1
                    //0 2 1
                    indices[i_ptr++] = lower_left;
                    indices[i_ptr++] = lower_right;
                    indices[i_ptr++] = upper_left;

                    //Triangle 2
                    //1 2 3
                    indices[i_ptr++] = upper_left;
                    indices[i_ptr++] = lower_right;
                    indices[i_ptr++] = upper_right;
                }
            }
        }
    }
}

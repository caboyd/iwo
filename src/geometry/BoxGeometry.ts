import { AttributeType, Geometry, Group } from "./Geometry";

enum Order {
    x = 0,
    y = 1,
    z = 2
}

export class BoxGeometry implements Geometry {
    indices: Uint16Array | Uint32Array | undefined;
    attribute_flags: number;
    attributes: Map<AttributeType, ArrayBufferView>;
    groups: Group[];

    isInterleaved: boolean;
    interleaved_attributes: Float32Array;

    //Bounding Sphere

    //Bounding Box (AABB)

    constructor(
        width: number = 1,
        height: number = 1,
        depth: number = 1,
        width_segments: number = 1,
        height_segments: number = 1,
        depth_segments: number = 1,
        stretch_texture: boolean = true
    ) {
        this.attributes = new Map<AttributeType, ArrayBufferView>();

        let width_segs = Math.floor(width_segments) || 1;
        let height_segs = Math.floor(height_segments) || 1;
        let depth_segs = Math.floor(depth_segments) || 1;

        let front_back = (width > 0 && height > 0) ? 2 * (width_segs + 1) * (height_segs + 1) : 0;
        let left_right = (depth > 0 && height > 0) ? 2 * (height_segs + 1) * (depth_segs + 1) : 0;
        let top_bottom = (depth > 0 && width > 0) ? 2 * (depth_segs + 1) * (width_segs + 1) : 0;

        let total_verts = front_back + left_right + top_bottom;

        front_back = width_segs * height_segs;
        left_right = height_segs * depth_segs;
        top_bottom = depth_segs * width_segs;

        let total_indices = 6 * 2 * (front_back + left_right + top_bottom);

        let index_size = 2;
        if (total_verts >= 65536) {
            this.indices = new Uint32Array(total_indices);
            index_size = 4;
        }
        else this.indices = new Uint16Array(total_indices);

        let indices = this.indices;

        let verts = new Float32Array(total_verts * 3);
        let normals = new Float32Array(total_verts * 3);
        let tex_coords = new Float32Array(total_verts * 2);
        let tangents = new Float32Array(total_verts * 3);
        let bitangents = new Float32Array(total_verts * 3);

        let interleaved = new Float32Array(total_verts * 14);
        let groups: Group[] = [];

        let half_width = width / 2;
        let half_height = height / 2;
        let half_depth = depth / 2;

        let ptr = 0;
        let tex_ptr = 0;
        let i_ptr = 0;
        let interleaved_ptr = 0;
        let vertex_count = 0;

        if (width !== 0 && height !== 0) {
            //Build Front Side
            buildSide(Order.x, Order.y, Order.z, width, width_segs, height, height_segs, half_depth, 1, 1, 0);
            //Build Back Side
            buildSide(Order.x, Order.y, Order.z, width, width_segs, height, height_segs, -half_depth, -1, 1, 1);
        }

        if (depth !== 0 && height !== 0) {
            //Build Left Side
            buildSide(Order.z, Order.y, Order.x, depth, depth_segs, height, height_segs, -half_width, 1, 1, 2);
            //Build Right Side
            buildSide(Order.z, Order.y, Order.x, depth, depth_segs, height, height_segs, half_width, -1, 1, 3);
        }
        if (depth !== 0 && width !== 0) {
            //Build Top Side
            buildSide(Order.x, Order.z, Order.y, width, width_segs, depth, depth_segs, half_height, 1, -1, 4);
            //Build Bottom Side
            buildSide(Order.x, Order.z, Order.y, width, width_segs, depth, depth_segs, -half_height, 1, 1, 5);
        }

        this.isInterleaved = true;
        this.attribute_flags =
            AttributeType.Vertex |
            AttributeType.Normals |
            AttributeType.Tex_Coords |
            AttributeType.Tangents |
            AttributeType.Bitangents;

        this.attributes.set(AttributeType.Vertex, verts);
        this.attributes.set(AttributeType.Normals, normals);
        this.attributes.set(AttributeType.Tex_Coords, tex_coords);
        this.attributes.set(AttributeType.Tangents, tangents);
        this.attributes.set(AttributeType.Bitangents, bitangents);
        this.interleaved_attributes = interleaved;
        this.groups = groups;

        /**
         * Fills the Arrays for one side of a cube
         * Fills vertices, normals, texture_coords, tangents, and indices
         *
         * @modifies {ptr} ptr is incremented 3 for each vertex
         * @modifies {i_ptr} i_ptr is incremented 3 for each indices
         * @modifies {tex_ptr} ptr is incremented 2 for each vertex
         * @modifies {vertex_index} is incremented by the number of vertices used by the indices
         * @modifies {verts} values are placed at the index of ptr
         * @modifies {normals} values are placed at the index of ptr
         * @modifies {tex_coords} values are placed at the index of ptr
         * @modifies {tangents} values are placed at the index of ptr
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
            let half_horizontal = horizontal_size / 2;
            let half_vertical = vertical_size / 2;

            let horizontal_step = horizontal_size / horizontal_steps;
            let vertical_step = vertical_size / vertical_steps;

            //The start_vertex is the first vertex the indices array will use
            let start_vertex = vertex_count;

            for (let x = -half_horizontal, i = 0; i <= horizontal_steps; x += horizontal_step, i++) {
                for (let y = -half_vertical, j = 0; j <= vertical_steps; y += vertical_step, j++) {
                    //The X,Y,Z Coords are different based on the side
                    let px = ptr + x_order;
                    let py = ptr + y_order;
                    let pz = ptr + z_order;

                    let ipx = interleaved_ptr + x_order;
                    let ipy = interleaved_ptr + y_order;
                    let ipz = interleaved_ptr + z_order;

                    //The X coords may go from left to right or right to left
                    interleaved[ipx] = verts[px] = x * x_dir;
                    
                    //The Y coords may go from bottom to top or top to bottom
                    interleaved[ipy] = verts[py] = y * y_dir;
                    //The Z coordinate is the same for a side
                    interleaved[ipz] = verts[pz] = plane;

                    //If stretched then texture_coords go from 0 to 1.
                    //If not stretched texture_coords go above 1;
                    interleaved[interleaved_ptr + 3] = tex_coords[tex_ptr++] = stretch_texture
                        ? (i * horizontal_step) / horizontal_size
                        : i;
                    interleaved[interleaved_ptr + 4] = tex_coords[tex_ptr++] = stretch_texture
                        ? (j * vertical_step) / vertical_size
                        : j;

                    //The normal is just 1 in the direction of the side
                    interleaved[ipx + 5] = normals[px] = 0;
                    interleaved[ipy + 5] = normals[py] = 0;
                    interleaved[ipz + 5] = normals[pz] = plane > 0 ? 1 : -1;

                    //The tangent is any vector orthogonal to the normal
                    interleaved[ipx + 8] = tangents[px] = x_dir;
                    interleaved[ipy + 8] = tangents[py] = 0;
                    interleaved[ipz + 8] = tangents[pz] = 0;

                    //The bitangent is any vector orthogonal to the normal and tangent
                    interleaved[ipx + 11] = bitangents[px] = 0;
                    interleaved[ipy + 11] = bitangents[py] = y_dir;
                    interleaved[ipz + 11] = bitangents[pz] = 0;

                    //Processed one vertex
                    ptr += 3;
                    interleaved_ptr += 14;
                    vertex_count++;
                }
            }

            //INDICES
            let index_count = 0;
            for (let i = 0; i < horizontal_steps; i++) {
                for (let j = 0; j < vertical_steps; j++) {
                    //The Vertex indices of the 4 corners we need for this quad
                    let lower_left = start_vertex + (vertical_steps + 1) * i + j;
                    let lower_right = start_vertex + (vertical_steps + 1) * (i + 1) + j;
                    let upper_left = lower_left + 1;
                    let upper_right = lower_right + 1;

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

                    //number of indices for a quad
                    index_count += 6;
                }
            }
            //Each side is a seperate group so they can be rendered with different materials
            groups.push({ count: index_count, offset: (i_ptr - index_count)*index_size, material_index: mat_index } as Group);

        }
    }
}
